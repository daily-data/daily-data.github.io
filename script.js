// ===== 管理者パスワード（ここを変更してください） =====
const ADMIN_PASSWORD = 'data';

// ===== ストレージ =====
const STORAGE_KEY   = 'blog_entries';
const AUTH_KEY      = 'blog_admin_authed';

function getSavedEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}
function setAuthed(val) {
  if (val) sessionStorage.setItem(AUTH_KEY, '1');
  else sessionStorage.removeItem(AUTH_KEY);
}

// ===== 状態 =====
let allEntries      = [];
let currentCategory = 'all';
let calendarYear, calendarMonth;
let editingId       = null; // 編集中の記事ID（nullなら新規）

// ===== データ読み込み =====
async function loadEntries() {
  let jsonEntries = [];
  try {
    const res = await fetch('entries.json');
    if (res.ok) jsonEntries = await res.json();
  } catch (_) {}

  const saved = getSavedEntries();
  const merged = [...jsonEntries];
  saved.forEach(s => {
    if (!merged.find(e => String(e.id) === String(s.id))) merged.push(s);
  });
  allEntries = merged.sort((a, b) => b.date.localeCompare(a.date));

  renderEntries();
  renderCalendar();
  renderStreak();
  renderStats();
  updateAdminUI();
}

// ===== 管理者UIの表示切り替え =====
function updateAdminUI() {
  const authed = isAuthed();
  // FABボタン
  document.getElementById('fab-btn').style.display = authed ? 'flex' : 'none';
  // ヘッダーのログインボタン
  document.getElementById('admin-login-btn').style.display  = authed ? 'none'  : 'inline-flex';
  document.getElementById('admin-logout-btn').style.display = authed ? 'inline-flex' : 'none';
  // 記事カードの編集ボタン
  document.querySelectorAll('.entry-edit-btn').forEach(b => {
    b.style.display = authed ? 'inline-flex' : 'none';
  });
}

// ===== ログイン =====
document.getElementById('admin-login-btn').addEventListener('click', () => {
  openLoginModal();
});
document.getElementById('admin-logout-btn').addEventListener('click', () => {
  setAuthed(false);
  updateAdminUI();
  showToast('ログアウトしました');
});

function openLoginModal() {
  document.getElementById('login-input').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('login-input').focus(), 80);
}

document.getElementById('login-submit').addEventListener('click', doLogin);
document.getElementById('login-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('login-cancel').addEventListener('click', () => {
  document.getElementById('login-overlay').style.display = 'none';
});

function doLogin() {
  const val = document.getElementById('login-input').value;
  if (val === ADMIN_PASSWORD) {
    setAuthed(true);
    document.getElementById('login-overlay').style.display = 'none';
    updateAdminUI();
    showToast('ログインしました');
  } else {
    document.getElementById('login-error').textContent = 'パスワードが違います';
    document.getElementById('login-input').value = '';
    document.getElementById('login-input').focus();
  }
}

// ===== 記事一覧 =====
function renderEntries() {
  const list  = document.getElementById('entries-list');
  const noMsg = document.getElementById('no-entries');
  const authed = isAuthed();

  const filtered = currentCategory === 'all'
    ? allEntries
    : allEntries.filter(e => e.category === currentCategory);

  if (filtered.length === 0) {
    list.innerHTML = '';
    noMsg.style.display = 'block';
    return;
  }
  noMsg.style.display = 'none';

  list.innerHTML = filtered.map(entry => {
    const chars = (entry.body || '').replace(/\s/g, '').length;
    const pct   = Math.min(100, Math.round(chars / 500 * 100));
    const achieved = chars >= 500 ? '<span class="achieved-badge">500字達成</span>' : '';
    const excerpt  = (entry.body || '').slice(0, 80).replace(/\n/g, ' ');

    return `<article class="entry-card" data-id="${entry.id}">
  <div class="entry-meta">
    <span class="entry-date">${formatDate(entry.date)}</span>
    <span class="cat-badge">${escHtml(entry.category)}</span>
    ${achieved}
    <button class="entry-edit-btn" data-id="${entry.id}" style="display:${authed?'inline-flex':'none'}" title="編集">編集</button>
  </div>
  <h2 class="entry-title">${escHtml(entry.title)}</h2>
  <p class="entry-excerpt">${escHtml(excerpt)}${(entry.body||'').length > 80 ? '…' : ''}</p>
  <div class="entry-footer">
    <div class="char-mini-bar">
      <div class="char-mini-fill${chars >= 500 ? ' over' : ''}" style="width:${pct}%"></div>
    </div>
    <span class="entry-chars">${chars.toLocaleString()} 字</span>
  </div>
</article>`;
  }).join('');

  // 記事クリック → モーダル（編集ボタンのクリックは除外）
  list.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.entry-edit-btn')) return;
      openModal(card.dataset.id);
    });
  });

  // 編集ボタン
  list.querySelectorAll('.entry-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openCompose(btn.dataset.id);
    });
  });
}

// ===== カテゴリフィルター =====
document.getElementById('site-nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if (!btn) return;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = btn.dataset.category;
  renderEntries();
});

// ===== モーダル（閲覧） =====
function openModal(id) {
  const entry = allEntries.find(e => String(e.id) === String(id));
  if (!entry) return;
  const chars = (entry.body || '').replace(/\s/g, '').length;
  document.getElementById('modal-date').textContent  = formatDate(entry.date);
  document.getElementById('modal-cat').textContent   = entry.category;
  document.getElementById('modal-chars').textContent = chars.toLocaleString() + ' 字';
  document.getElementById('modal-title').textContent = entry.title;
  document.getElementById('modal-body').textContent  = entry.body || '';
  document.getElementById('modal-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

// ===== 投稿・編集パネル =====
const fab            = document.getElementById('fab-btn');
const composeOverlay = document.getElementById('compose-overlay');

fab.addEventListener('click', () => openCompose(null));
document.getElementById('compose-close').addEventListener('click', closeCompose);
composeOverlay.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCompose();
});

function openCompose(id) {
  if (!isAuthed()) { openLoginModal(); return; }

  editingId = id ? String(id) : null;
  const isEdit = editingId !== null;

  document.getElementById('compose-heading').textContent = isEdit ? '記事を編集' : '新しい記事';
  document.getElementById('compose-delete-btn').style.display = isEdit ? 'inline-flex' : 'none';

  if (isEdit) {
    const entry = allEntries.find(e => String(e.id) === editingId);
    if (!entry) return;
    document.getElementById('compose-title').value = entry.title;
    document.getElementById('compose-date').value  = entry.date;
    document.getElementById('compose-cat').value   = entry.category;
    document.getElementById('compose-body').value  = entry.body || '';
  } else {
    document.getElementById('compose-title').value = '';
    document.getElementById('compose-date').value  = toDateStr(new Date());
    document.getElementById('compose-cat').value   = '日記';
    document.getElementById('compose-body').value  = '';
  }

  updateCharCount();
  composeOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('compose-title').focus(), 80);
}

function closeCompose() {
  composeOverlay.style.display = 'none';
  document.body.style.overflow = '';
  editingId = null;
}

// 文字数カウント
document.getElementById('compose-body').addEventListener('input', updateCharCount);

function updateCharCount() {
  const count = document.getElementById('compose-body').value.replace(/\s/g, '').length;
  const pct   = Math.min(100, count / 500 * 100);
  const fill  = document.getElementById('char-bar-fill');
  const label = document.getElementById('char-count');

  fill.style.width = pct + '%';
  fill.className   = 'char-bar-fill';
  label.className  = 'char-count';

  if (count >= 500) {
    fill.classList.add('done');
    label.classList.add('done');
    label.textContent = `${count.toLocaleString()} / 500 ✓`;
  } else if (pct >= 80) {
    fill.classList.add('near');
    label.textContent = `${count.toLocaleString()} / 500`;
  } else {
    label.textContent = `${count.toLocaleString()} / 500`;
  }
}

// 投稿・更新
document.getElementById('compose-generate').addEventListener('click', () => {
  const title = document.getElementById('compose-title').value.trim();
  const date  = document.getElementById('compose-date').value;
  const cat   = document.getElementById('compose-cat').value;
  const body  = document.getElementById('compose-body').value.trim();

  if (!title || !date || !body) {
    alert('タイトル・日付・本文をすべて入力してください');
    return;
  }

  const saved = getSavedEntries();

  if (editingId) {
    // 既存記事を更新
    const idx = saved.findIndex(e => String(e.id) === editingId);
    const updated = { id: Number(editingId) || editingId, date, category: cat, title, body };
    if (idx >= 0) {
      saved[idx] = updated;
    } else {
      // entries.json 由来のものを saved に追加
      saved.push(updated);
    }
    saveEntries(saved);

    const ai = allEntries.findIndex(e => String(e.id) === editingId);
    if (ai >= 0) allEntries[ai] = updated;
    showToast('記事を更新しました');
  } else {
    // 新規投稿
    const newEntry = { id: Date.now(), date, category: cat, title, body };
    saved.push(newEntry);
    saveEntries(saved);
    allEntries.unshift(newEntry);
    showToast('投稿しました！');
  }

  allEntries.sort((a, b) => b.date.localeCompare(a.date));
  renderEntries();
  renderCalendar();
  renderStreak();
  renderStats();
  closeCompose();
});

// 削除
document.getElementById('compose-delete-btn').addEventListener('click', () => {
  if (!editingId) return;
  const entry = allEntries.find(e => String(e.id) === editingId);
  const label = entry ? `「${entry.title}」` : 'この記事';
  if (!confirm(`${label} を削除しますか？`)) return;

  const saved = getSavedEntries().filter(e => String(e.id) !== editingId);
  saveEntries(saved);
  allEntries = allEntries.filter(e => String(e.id) !== editingId);

  renderEntries();
  renderCalendar();
  renderStreak();
  renderStats();
  closeCompose();
  showToast('記事を削除しました');
});

// ===== カレンダー =====
function initCalendar() {
  const now = new Date();
  calendarYear  = now.getFullYear();
  calendarMonth = now.getMonth();
}

function renderCalendar() {
  const title = document.getElementById('calendar-title');
  const grid  = document.getElementById('calendar-grid');
  title.textContent = `${calendarYear}年 ${calendarMonth + 1}月`;

  const postMap = {};
  allEntries.forEach(e => {
    if (!e.date) return;
    const [y, m] = e.date.split('-').map(Number);
    if (y === calendarYear && m === calendarMonth + 1) {
      const chars = (e.body || '').replace(/\s/g, '').length;
      postMap[e.date] = { achieved: chars >= 500 };
    }
  });

  const todayStr  = toDateStr(new Date());
  const firstDay  = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  let html = ['日','月','火','水','木','金','土']
    .map(d => `<div class="cal-day-header">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day other-month"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds  = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const info = postMap[ds];
    let cls = 'cal-day';
    if (info) cls += info.achieved ? ' achieved' : ' has-post';
    if (ds === todayStr) cls += ' today';
    html += `<div class="${cls}">${d}</div>`;
  }
  grid.innerHTML = html;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  if (--calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  if (++calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
});

// ===== ストリーク =====
function renderStreak() {
  const dates = [...new Set(allEntries.map(e => e.date))].sort().reverse();
  let streak = 0;
  const check = new Date();
  check.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const str = toDateStr(check);
    if (dates.includes(str)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (i === 0) {
      check.setDate(check.getDate() - 1);
      if (!dates.includes(toDateStr(check))) break;
    } else break;
  }
  document.getElementById('streak-count').textContent = streak;
  const sub = document.getElementById('streak-sub');
  if      (streak === 0)  sub.textContent = 'まず1日書いてみよう';
  else if (streak < 3)    sub.textContent = 'いいスタート！続けよう';
  else if (streak < 7)    sub.textContent = `${streak}日目。調子いい！`;
  else if (streak < 30)   sub.textContent = `${streak}日連続。素晴らしい！`;
  else                    sub.textContent = `${streak}日連続。圧巻の継続力！`;
}

// ===== 統計 =====
function renderStats() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const thisMonth = allEntries.filter(e => {
    const [ey, em] = (e.date||'').split('-').map(Number);
    return ey === y && em === m;
  });
  const achieved = thisMonth.filter(e => (e.body||'').replace(/\s/g,'').length >= 500);
  const total    = thisMonth.reduce((s, e) => s + (e.body||'').replace(/\s/g,'').length, 0);
  document.getElementById('stat-posts').textContent    = thisMonth.length;
  document.getElementById('stat-achieved').textContent = achieved.length;
  document.getElementById('stat-total').textContent    = total >= 1000 ? (total/1000).toFixed(1)+'k' : total;
}

// ===== トースト =====
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:#2A6049;color:#fff;font-size:0.82rem;padding:0.55rem 1.2rem;border-radius:20px;z-index:400;pointer-events:none;opacity:0;transition:opacity 0.2s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.opacity = '0', 2200);
}

// ===== ユーティリティ =====
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== 起動 =====
initCalendar();
loadEntries();
