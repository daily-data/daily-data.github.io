// ============================================================
//  ★ 設定（ここだけ書き換えてください）
// ============================================================
const ADMIN_PASSWORD = 'diary2025';       // 管理者パスワード
const GITHUB_OWNER   = 'your-username';   // GitHubユーザー名
const GITHUB_REPO    = 'your-username.github.io'; // リポジトリ名
const GITHUB_FILE    = 'entries.json';    // 記事ファイルのパス
const GITHUB_IMG_DIR = 'images';           // 画像保存フォルダ
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
let currentSort     = 'date-desc';
let currentSearch   = '';
let calYear, calMonth;
let editingId       = null;
let currentSha      = '';   // entries.json の現在のSHA（更新に必要）
let pendingImages   = [];   // 投稿パネルで選択中の画像 [{file, dataUrl, name}]

// ============================================================
//  GitHub API
// ============================================================
const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

// 画像を GitHub にアップロード → URLを返す
async function uploadImageToGitHub(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const ext    = file.name.split('.').pop().toLowerCase();
        const fname  = `${GITHUB_IMG_DIR}/${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
        const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fname}`;
        const res = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${getPAT()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `画像を追加: ${fname}`,
            content: base64
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'upload failed');
        }
        // 公開URL
        const publicUrl = `https://${GITHUB_OWNER}.github.io/${fname}`;
        resolve({ url: publicUrl, path: fname });
      } catch(e) { reject(e); }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

async function fetchFromGitHub() {
  // SHAと内容を取得（書き込み前の最新SHA確認用）
  const res = await fetch(API, {
    headers: {
      'Authorization': `token ${getPAT()}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  currentSha = data.sha;
  return currentSha;
}

async function saveToGitHub(entries) {
  // 書き込み前に必ず最新SHAを取得（競合防止）
  await fetchFromGitHub();

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

  // キャッシュがあれば先に即表示（体感速度向上）
  const cache = getCache();
  if (cache) {
    allEntries = cache.entries || [];
    currentSha = cache.sha    || '';
    render();
  }

  // 常に entries.json を直接fetchして最新表示（認証不要）
  await refreshEntries();
  updateAdminUI();
}

// entries.json を直接fetchする（閲覧用・認証不要）
async function refreshEntries() {
  try {
    // キャッシュバスターでブラウザキャッシュを回避
    const url = `${GITHUB_FILE}?_=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const entries = await res.json();
    allEntries = entries.sort((a,b) => b.date.localeCompare(a.date));
    // SHAはPATありのときだけ取得（書き込みに必要）
    if (getPAT()) await refreshSha();
    setCache({ entries: allEntries, sha: currentSha });
    render();
  } catch (e) {
    console.warn('entries.json fetch failed:', e.message);
    // キャッシュのまま続行
  }
}

// SHAだけGitHub APIから取得（書き込み前に必要）
async function refreshSha() {
  try {
    const res = await fetch(API, {
      headers: {
        'Authorization': `token ${getPAT()}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      currentSha = data.sha;
    }
  } catch(e) { console.warn('SHA fetch failed:', e.message); }
}

async function refreshFromGitHub() {
  await refreshEntries();
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

  // カテゴリフィルター
  let filtered = currentCategory === 'all'
    ? [...allEntries]
    : allEntries.filter(e => e.category === currentCategory);

  // キーワード検索（タイトル＋本文）
  if (currentSearch) {
    const kw = currentSearch.toLowerCase();
    filtered = filtered.filter(e =>
      (e.title||'').toLowerCase().includes(kw) ||
      (e.body||'').toLowerCase().includes(kw)
    );
  }

  // ソート
  filtered.sort((a,b) => {
    switch(currentSort) {
      case 'date-asc':   return a.date.localeCompare(b.date);
      case 'chars-desc': return countChars(b.body) - countChars(a.body);
      case 'chars-asc':  return countChars(a.body) - countChars(b.body);
      default:           return b.date.localeCompare(a.date); // date-desc
    }
  });

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
    const imgs = e.images || [];
    const thumbHTML = imgs.length
      ? `<div class="card-thumbs">${imgs.slice(0,3).map(u=>`<img class="card-thumb" src="${u}" loading="lazy" alt="" />`).join('')}${imgs.length>3?`<span class="card-thumb-more">+${imgs.length-3}</span>`:''}</div>`
      : '';
    return `<article class="entry-card" data-id="${e.id}">
  <div class="entry-meta">
    <span class="entry-date">${fmtDate(e.date)}</span>
    <span class="cat-badge">${esc(e.category)}</span>
    ${achHTML}${editBtn}
  </div>
  <h2 class="entry-title">${esc(e.title)}</h2>
  ${thumbHTML}
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

// ソート
el('sort-select').addEventListener('change', e => {
  currentSort = e.target.value;
  renderEntries();
});

// キーワード検索（入力するたびに即時絞り込み）
el('search-input').addEventListener('input', e => {
  currentSearch = e.target.value.trim();
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
  // 画像
  const imgs = e.images || [];
  el('modal-images').innerHTML = imgs.length
    ? `<div class="modal-img-grid">${imgs.map(u=>`<img class="modal-img" src="${u}" loading="lazy" alt="" onclick="openLightbox('${u}')" />`).join('')}</div>`
    : '';
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
  // 画像プレビューを初期化
  pendingImages = [];
  if (isEdit) {
    const entry = allEntries.find(x => String(x.id)===editingId);
    // 既存画像を pendingImages に読み込む
    (entry?.images || []).forEach(url => {
      pendingImages.push({ url, existing: true });
    });
  }
  renderImgPreview();
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
    // 新規画像をGitHubにアップロード
    const uploadedUrls = [];
    const newFiles = pendingImages.filter(p => !p.existing);
    if (newFiles.length > 0) {
      btn.textContent = `画像をアップロード中… (0/${newFiles.length})`;
      for (let i=0; i<newFiles.length; i++) {
        btn.textContent = `画像をアップロード中… (${i+1}/${newFiles.length})`;
        const result = await uploadImageToGitHub(newFiles[i].file);
        uploadedUrls.push(result.url);
      }
    }
    // 既存画像URL ＋ 新規アップロードURL
    const existingUrls = pendingImages.filter(p => p.existing).map(p => p.url);
    const allImageUrls = [...existingUrls, ...uploadedUrls];

    btn.textContent = '保存中…';
    let newEntries;
    if (editingId) {
      const updated = { id: editingId, date, category: cat, title, body, images: allImageUrls };
      newEntries = allEntries.map(e => String(e.id)===editingId ? updated : e);
      toast('記事を更新しました');
    } else {
      const entry = { id: String(Date.now()), date, category: cat, title, body, images: allImageUrls };
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
//  画像UI
// ============================================================

// ファイル選択ボタン
el('img-upload-btn').addEventListener('click', () => el('img-file-input').click());

// ファイルが選ばれたとき
el('img-file-input').addEventListener('change', e => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) { alert(`${file.name} は5MBを超えています`); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      pendingImages.push({ file, dataUrl: ev.target.result, existing: false });
      renderImgPreview();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = ''; // 同じファイルを再選択できるようリセット
});

// ドラッグ＆ドロップ
const uploadArea = el('img-upload-area');
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', ()=> uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  Array.from(e.dataTransfer.files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5*1024*1024) { alert(`${file.name} は5MBを超えています`); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      pendingImages.push({ file, dataUrl: ev.target.result, existing: false });
      renderImgPreview();
    };
    reader.readAsDataURL(file);
  });
});

function renderImgPreview() {
  const wrap = el('img-preview-list');
  if (!pendingImages.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = pendingImages.map((p,i) => `
    <div class="img-preview-item">
      <img src="${p.existing ? p.url : p.dataUrl}" class="img-preview-thumb" alt="" />
      ${p.existing ? '<span class="img-preview-label">保存済</span>' : '<span class="img-preview-label new">新規</span>'}
      <button class="img-preview-remove" data-idx="${i}" title="削除">&times;</button>
    </div>`).join('');
  wrap.querySelectorAll('.img-preview-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingImages.splice(Number(btn.dataset.idx), 1);
      renderImgPreview();
    });
  });
}

// ライトボックス（モーダル内画像クリック）
function openLightbox(url) {
  let lb = document.getElementById('_lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = '_lightbox';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9000;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    lb.innerHTML = '<img id="_lb_img" style="max-width:92vw;max-height:92vh;border-radius:4px;object-fit:contain;" />';
    lb.addEventListener('click', () => lb.style.display = 'none');
    document.body.appendChild(lb);
  }
  document.getElementById('_lb_img').src = url;
  lb.style.display = 'flex';
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
