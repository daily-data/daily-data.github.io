// ============================================================
//  ★ 設定（ここだけ書き換えてください）
// ============================================================
const ADMIN_PASSWORD = 'data';       // 管理者パスワード
const GITHUB_OWNER   = 'daily-data';   // GitHubユーザー名
const GITHUB_REPO    = 'daily-data.github.io'; // リポジトリ名
const GITHUB_FILE    = 'entries.json';    // 記事ファイルのパス
// PATはログイン後に管理者設定画面から入力します（コードに書かない）

// ============================================================
//  内部定数
// ============================================================
const AUTH_KEY    = 'blog_admin_authed';
const PAT_KEY     = 'blog_github_pat';
const CACHE_KEY   = 'blog_entries_cache';

// ============================================================
//  ストレージ
// ============================================================
function getPAT()        { return sessionStorage.getItem(PAT_KEY) || ''; }
function setPAT(v)       { sessionStorage.setItem(PAT_KEY, v); }
function isAuthed()      { return sessionStorage.getItem(AUTH_KEY) === '1'; }
function setAuthed(v)    { v ? sessionStorage.setItem(AUTH_KEY,'1') : sessionStorage.removeItem(AUTH_KEY); }
function getCache()      { try { return JSON.parse(localStorage.getItem(CACHE_KEY)||'null'); } catch{return null;} }
function setCache(data)  { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }

// ============================================================
//  状態
// ============================================================
let allEntries      = [];
let currentCategory = 'all';
let calYear, calMonth;
let editingId       = null;
let currentSha      = '';   // entries.json の現在のSHA（更新に必要）

// ============================================================
//  GitHub API
// ============================================================
const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

async function fetchFromGitHub() {
  const res = await fetch(API, {
    headers: {
      'Authorization': `token ${getPAT()}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  currentSha = data.sha;
  const json = JSON.parse(atob(data.content.replace(/\n/g,'')));
  return json;
}

async function saveToGitHub(entries) {
  const content = btoa(unescape(encodeURIComponent(
    JSON.stringify(entries, null, 2)
  )));
  const body = {
    message: `記事を更新 ${new Date().toLocaleDateString('ja-JP')}`,
    content,
    sha: currentSha
  };
  const res = await fetch(API, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${getPAT()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  const result = await res.json();
  currentSha = result.content.sha; // 更新後のSHAを保持
  return result;
}

// ============================================================
//  起動
// ============================================================
async function boot() {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  // キャッシュがあれば先に表示（表示を速くする）
  const cache = getCache();
  if (cache) {
    allEntries = cache.entries || [];
    currentSha = cache.sha    || '';
    render();
  }

  // PATがあればGitHubから最新を取得
  if (getPAT()) {
    await refreshFromGitHub();
  }

  updateAdminUI();
}

async function refreshFromGitHub() {
  try {
    const entries = await fetchFromGitHub();
    allEntries = entries.sort((a,b) => b.date.localeCompare(a.date));
    setCache({ entries: allEntries, sha: currentSha });
    render();
  } catch (e) {
    console.warn('GitHub fetch failed:', e.message);
    // キャッシュのまま続行（オフラインでも閲覧可）
  }
}

// ============================================================
//  管理者UI 切り替え
// ============================================================
function updateAdminUI() {
  const ok = isAuthed();
  el('fab-btn').style.display          = ok ? 'flex'        : 'none';
  el('admin-login-btn').style.display  = ok ? 'none'        : 'inline-flex';
  el('admin-logout-btn').style.display = ok ? 'inline-flex' : 'none';
  document.querySelectorAll('.edit-btn').forEach(b => {
    b.style.display = ok ? 'inline-flex' : 'none';
  });
}

// ============================================================
//  ログイン
// ============================================================
el('admin-login-btn').addEventListener('click', openLogin);
el('admin-logout-btn').addEventListener('click', () => {
  setAuthed(false);
  setPAT('');
  updateAdminUI();
  toast('ログアウトしました');
});

function openLogin() {
  el('login-pass').value = '';
  el('login-pat').value  = getPAT(); // 再ログイン時はPATを保持
  el('login-error').textContent = '';
  show('login-overlay');
  setTimeout(() => el('login-pass').focus(), 80);
}

el('login-cancel').addEventListener('click', () => hide('login-overlay'));
el('login-overlay').addEventListener('click', e => {
  if (e.target === el('login-overlay')) hide('login-overlay');
});
el('login-submit').addEventListener('click', doLogin);
el('login-pass').addEventListener('keydown', e => { if(e.key==='Enter') el('login-pat').focus(); });
el('login-pat').addEventListener('keydown',  e => { if(e.key==='Enter') doLogin(); });

async function doLogin() {
  if (el('login-pass').value !== ADMIN_PASSWORD) {
    el('login-error').textContent = 'パスワードが違います';
    el('login-pass').value = '';
    el('login-pass').focus();
    return;
  }
  const pat = el('login-pat').value.trim();
  if (!pat) {
    el('login-error').textContent = 'GitHub Personal Access Tokenを入力してください';
    el('login-pat').focus();
    return;
  }

  // PATの疎通確認
  el('login-submit').textContent = '確認中…';
  el('login-submit').disabled    = true;
  try {
    setPAT(pat);
    await refreshFromGitHub();
    setAuthed(true);
    hide('login-overlay');
    updateAdminUI();
    toast('ログインしました');
  } catch(e) {
    el('login-error').textContent = 'Token が無効か、リポジトリ設定が間違っています';
    setPAT('');
  } finally {
    el('login-submit').textContent = 'ログイン';
    el('login-submit').disabled    = false;
  }
}

// ============================================================
//  記事一覧
// ============================================================
function renderEntries() {
  const list = el('entries-list');
  const none = el('no-entries');
  const ok   = isAuthed();

  const filtered = currentCategory === 'all'
    ? allEntries
    : allEntries.filter(e => e.category === currentCategory);

  if (!filtered.length) {
    list.innerHTML = '';
    none.style.display = 'block';
    return;
  }
  none.style.display = 'none';

  list.innerHTML = filtered.map(e => {
    const chars   = countChars(e.body);
    const pct     = Math.min(100, chars/500*100);
    const achHTML = chars >= 500 ? '<span class="achieved-badge">500字達成</span>' : '';
    const excerpt = (e.body||'').slice(0,80).replace(/\n/g,' ');
    const editBtn = `<button class="edit-btn" data-id="${e.id}" style="display:${ok?'inline-flex':'none'}">編集</button>`;
    return `<article class="entry-card" data-id="${e.id}">
  <div class="entry-meta">
    <span class="entry-date">${fmtDate(e.date)}</span>
    <span class="cat-badge">${esc(e.category)}</span>
    ${achHTML}${editBtn}
  </div>
  <h2 class="entry-title">${esc(e.title)}</h2>
  <p class="entry-excerpt">${esc(excerpt)}${(e.body||'').length>80?'…':''}</p>
  <div class="entry-footer">
    <div class="char-mini-bar">
      <div class="char-mini-fill${chars>=500?' over':''}" style="width:${pct}%"></div>
    </div>
    <span class="entry-chars">${chars.toLocaleString()} 字</span>
  </div>
</article>`;
  }).join('');

  list.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.edit-btn')) return;
      openDetail(card.dataset.id);
    });
  });
  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openCompose(btn.dataset.id);
    });
  });
}

// ============================================================
//  カテゴリ
// ============================================================
el('site-nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if (!btn) return;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = btn.dataset.category;
  renderEntries();
});

// ============================================================
//  詳細モーダル
// ============================================================
function openDetail(id) {
  const e = allEntries.find(x => String(x.id)===String(id));
  if (!e) return;
  const chars = countChars(e.body);
  el('modal-date').textContent  = fmtDate(e.date);
  el('modal-cat').textContent   = e.category;
  el('modal-chars').textContent = chars.toLocaleString()+' 字';
  el('modal-title').textContent = e.title;
  el('modal-body').textContent  = e.body||'';
  show('modal-overlay');
}
el('modal-close').addEventListener('click', () => hide('modal-overlay'));
el('modal-overlay').addEventListener('click', e => {
  if (e.target===el('modal-overlay')) hide('modal-overlay');
});

// ============================================================
//  投稿・編集パネル
// ============================================================
el('fab-btn').addEventListener('click', () => openCompose(null));
el('compose-close').addEventListener('click', closeCompose);
el('compose-overlay').addEventListener('click', e => {
  if (e.target===el('compose-overlay')) closeCompose();
});

function openCompose(id) {
  if (!isAuthed()) { openLogin(); return; }
  editingId = id ? String(id) : null;
  const isEdit = !!editingId;
  el('compose-heading').textContent    = isEdit ? '記事を編集' : '新しい記事';
  el('compose-save-btn').textContent   = isEdit ? '更新する'   : '投稿する';
  el('compose-delete-btn').style.display = isEdit ? 'inline-flex' : 'none';

  if (isEdit) {
    const e = allEntries.find(x => String(x.id)===editingId);
    if (!e) return;
    el('compose-title').value = e.title    || '';
    el('compose-date').value  = e.date     || '';
    el('compose-cat').value   = e.category || '日記';
    el('compose-body').value  = e.body     || '';
  } else {
    el('compose-title').value = '';
    el('compose-date').value  = dateStr(new Date());
    el('compose-cat').value   = '日記';
    el('compose-body').value  = '';
  }
  updateCharCount();
  show('compose-overlay');
  setTimeout(() => el('compose-title').focus(), 80);
}

function closeCompose() {
  hide('compose-overlay');
  editingId = null;
}

el('compose-body').addEventListener('input', updateCharCount);
function updateCharCount() {
  const count = countChars(el('compose-body').value);
  const pct   = Math.min(100, count/500*100);
  const fill  = el('char-bar-fill');
  const lbl   = el('char-count');
  fill.style.width = pct+'%';
  fill.className   = 'char-bar-fill'+(count>=500?' done':pct>=80?' near':'');
  lbl.className    = 'char-count'+(count>=500?' done':'');
  lbl.textContent  = count>=500
    ? `${count.toLocaleString()} / 500 ✓`
    : `${count.toLocaleString()} / 500`;
}

// 保存（投稿 or 更新）
el('compose-save-btn').addEventListener('click', async () => {
  const title = el('compose-title').value.trim();
  const date  = el('compose-date').value;
  const cat   = el('compose-cat').value;
  const body  = el('compose-body').value.trim();

  if (!title || !date || !body) {
    alert('タイトル・日付・本文をすべて入力してください');
    return;
  }

  const btn = el('compose-save-btn');
  btn.textContent = '保存中…';
  btn.disabled    = true;

  try {
    let newEntries;
    if (editingId) {
      const updated = { id: editingId, date, category: cat, title, body };
      newEntries = allEntries.map(e => String(e.id)===editingId ? updated : e);
      toast('記事を更新しました');
    } else {
      const entry = { id: String(Date.now()), date, category: cat, title, body };
      newEntries = [entry, ...allEntries];
      toast('投稿しました！');
    }
    newEntries = newEntries.sort((a,b) => b.date.localeCompare(a.date));
    await saveToGitHub(newEntries);
    allEntries = newEntries;
    setCache({ entries: allEntries, sha: currentSha });
    closeCompose();
    render();
  } catch(e) {
    alert('保存に失敗しました: ' + e.message);
  } finally {
    btn.textContent = editingId ? '更新する' : '投稿する';
    btn.disabled    = false;
  }
});

// 削除
el('compose-delete-btn').addEventListener('click', async () => {
  if (!editingId) return;
  const e = allEntries.find(x => String(x.id)===editingId);
  if (!confirm(`「${e?.title||'この記事'}」を削除しますか？`)) return;

  const btn = el('compose-delete-btn');
  btn.textContent = '削除中…';
  btn.disabled    = true;

  try {
    const newEntries = allEntries.filter(x => String(x.id)!==editingId);
    await saveToGitHub(newEntries);
    allEntries = newEntries;
    setCache({ entries: allEntries, sha: currentSha });
    closeCompose();
    render();
    toast('削除しました');
  } catch(e) {
    alert('削除に失敗しました: ' + e.message);
  } finally {
    btn.textContent = '削除';
    btn.disabled    = false;
  }
});

// ============================================================
//  カレンダー
// ============================================================
function renderCalendar() {
  el('calendar-title').textContent = `${calYear}年 ${calMonth+1}月`;
  const map = {};
  allEntries.forEach(e => {
    if (!e.date) return;
    const [y,m] = e.date.split('-').map(Number);
    if (y===calYear && m===calMonth+1) map[e.date] = countChars(e.body) >= 500;
  });
  const today    = dateStr(new Date());
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const days     = new Date(calYear, calMonth+1, 0).getDate();
  let html = ['日','月','火','水','木','金','土']
    .map(d=>`<div class="cal-day-header">${d}</div>`).join('');
  for (let i=0;i<firstDay;i++) html+='<div class="cal-day other-month"></div>';
  for (let d=1;d<=days;d++) {
    const ds = `${calYear}-${pad(calMonth+1)}-${pad(d)}`;
    let cls = 'cal-day';
    if (ds in map) cls += map[ds]?' achieved':' has-post';
    if (ds===today) cls+=' today';
    html+=`<div class="${cls}">${d}</div>`;
  }
  el('calendar-grid').innerHTML = html;
}
el('cal-prev').addEventListener('click',()=>{ if(--calMonth<0){calMonth=11;calYear--;} renderCalendar(); });
el('cal-next').addEventListener('click',()=>{ if(++calMonth>11){calMonth=0;calYear++;} renderCalendar(); });

// ============================================================
//  ストリーク
// ============================================================
function renderStreak() {
  const dates = [...new Set(allEntries.map(e=>e.date))].sort().reverse();
  let streak=0;
  const cur = new Date(); cur.setHours(0,0,0,0);
  for (let i=0;i<365;i++) {
    const s = dateStr(cur);
    if (dates.includes(s)) { streak++; cur.setDate(cur.getDate()-1); }
    else if (i===0) { cur.setDate(cur.getDate()-1); if(!dates.includes(dateStr(cur))) break; }
    else break;
  }
  el('streak-count').textContent = streak;
  el('streak-sub').textContent =
    streak===0 ? 'まず1日書いてみよう' :
    streak<3   ? 'いいスタート！' :
    streak<7   ? `${streak}日目、好調！` :
    streak<30  ? `${streak}日連続、素晴らしい！` :
                 `${streak}日連続、圧巻！`;
}

// ============================================================
//  統計
// ============================================================
function renderStats() {
  const now = new Date();
  const y=now.getFullYear(), m=now.getMonth()+1;
  const cur = allEntries.filter(e=>{
    const [ey,em]=((e.date||'').split('-')).map(Number);
    return ey===y&&em===m;
  });
  const ach   = cur.filter(e=>countChars(e.body)>=500).length;
  const total = cur.reduce((s,e)=>s+countChars(e.body),0);
  el('stat-posts').textContent    = cur.length;
  el('stat-achieved').textContent = ach;
  el('stat-total').textContent    = total>=1000?(total/1000).toFixed(1)+'k':total;
}

// ============================================================
//  まとめて再描画
// ============================================================
function render() {
  renderEntries();
  renderCalendar();
  renderStreak();
  renderStats();
}

// ============================================================
//  トースト
// ============================================================
function toast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'5rem', left:'50%', transform:'translateX(-50%)',
      background:'#2A6049', color:'#fff', fontSize:'0.82rem',
      padding:'0.55rem 1.2rem', borderRadius:'20px', zIndex:'9999',
      pointerEvents:'none', opacity:'0', transition:'opacity 0.2s', whiteSpace:'nowrap'
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.style.opacity='0', 2500);
}

// ============================================================
//  ユーティリティ
// ============================================================
function el(id)        { return document.getElementById(id); }
function show(id)      { el(id).style.display='flex'; document.body.style.overflow='hidden'; }
function hide(id)      { el(id).style.display='none'; document.body.style.overflow=''; }
function countChars(s) { return (s||'').replace(/\s/g,'').length; }
function dateStr(d)    { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function pad(n)        { return String(n).padStart(2,'0'); }
function fmtDate(s)    { if(!s) return ''; const[y,m,d]=s.split('-'); return `${y}年${Number(m)}月${Number(d)}日`; }
function esc(s)        { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ============================================================
//  起動
// ============================================================
boot();
