// ===== ストレージ =====
// entries.json（初期サンプル）＋ localStorage（追加投稿）を合成

const STORAGE_KEY = 'blog_entries';

function getSavedEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

let allEntries = [];
let currentCategory = 'all';
let calendarYear, calendarMonth;

async function loadEntries() {
  // まず entries.json を試みる（GitHub Pages上でのみ成功）
  let jsonEntries = [];
  try {
    const res = await fetch('entries.json');
    if (res.ok) jsonEntries = await res.json();
  } catch (_) {}

  // localStorage の追加投稿とマージ（id重複排除）
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
}

// ===== 記事一覧 =====
function renderEntries() {
  const list = document.getElementById('entries-list');
  const noMsg = document.getElementById('no-entries');

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
    const charCount = (entry.body || '').replace(/\s/g, '').length;
    const pct = Math.min(100, Math.round(charCount / 500 * 100));
    const achieved = charCount >= 500
      ? '<span class="achieved-badge">500字達成</span>' : '';
    const excerpt = (entry.body || '').slice(0, 80).replace(/\n/g, ' ');
    const dateStr = formatDate(entry.date);

    return `<article class="entry-card" data-id="${entry.id}">
  <div class="entry-meta">
    <span class="entry-date">${dateStr}</span>
    <span class="cat-badge">${escHtml(entry.category)}</span>
    ${achieved}
  </div>
  <h2 class="entry-title">${escHtml(entry.title)}</h2>
  <p class="entry-excerpt">${escHtml(excerpt)}${(entry.body||'').length > 80 ? '…' : ''}</p>
  <div class="entry-footer">
    <div class="char-mini-bar">
      <div class="char-mini-fill${charCount >= 500 ? ' over' : ''}" style="width:${pct}%"></div>
    </div>
    <span class="entry-chars">${charCount.toLocaleString()} 字</span>
  </div>
</article>`;
  }).join('');

  list.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

// ===== モーダル =====
function openModal(id) {
  const entry = allEntries.find(e => String(e.id) === String(id));
  if (!entry) return;
  const charCount = (entry.body || '').replace(/\s/g, '').length;
  document.getElementById('modal-date').textContent = formatDate(entry.date);
  document.getElementById('modal-cat').textContent = entry.category;
  document.getElementById('modal-chars').textContent = charCount.toLocaleString() + ' 字';
  document.getElementById('modal-title').textContent = entry.title;
  document.getElementById('modal-body').textContent = entry.body || '';
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

// ===== カテゴリフィルター =====
document.getElementById('site-nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if (!btn) return;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = btn.dataset.category;
  renderEntries();
});

// ===== カレンダー =====
function initCalendar() {
  const now = new Date();
  calendarYear = now.getFullYear();
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
      postMap[e.date] = { posted: true, achieved: chars >= 500 };
    }
  });

  const todayStr = toDateStr(new Date());
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const headers = ['日','月','火','水','木','金','土'];
  let html = headers.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day other-month"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const info = postMap[ds];
    let cls = 'cal-day';
    if (info) cls += info.achieved ? ' achieved' : ' has-post';
    if (ds === todayStr) cls += ' today';
    html += `<div class="${cls}">${d}</div>`;
  }
  grid.innerHTML = html;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calendarMonth--;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  calendarMonth++;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
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
    } else {
      break;
    }
  }

  document.getElementById('streak-count').textContent = streak;
  const sub = document.getElementById('streak-sub');
  if (streak === 0)      sub.textContent = 'まず1日書いてみよう';
  else if (streak < 3)   sub.textContent = 'いいスタート！続けよう';
  else if (streak < 7)   sub.textContent = `${streak}日目。調子いい！`;
  else if (streak < 30)  sub.textContent = `${streak}日連続。素晴らしい！`;
  else                   sub.textContent = `${streak}日連続。圧巻の継続力！`;
}

// ===== 統計 =====
function renderStats() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const thisMonth = allEntries.filter(e => {
    const [ey, em] = (e.date || '').split('-').map(Number);
    return ey === y && em === m;
  });
  const achieved = thisMonth.filter(e => (e.body||'').replace(/\s/g,'').length >= 500);
  const total = thisMonth.reduce((s, e) => s + (e.body||'').replace(/\s/g,'').length, 0);
  document.getElementById('stat-posts').textContent    = thisMonth.length;
  document.getElementById('stat-achieved').textContent = achieved.length;
  document.getElementById('stat-total').textContent    = total >= 1000 ? (total/1000).toFixed(1)+'k' : total;
}

// ===== 投稿パネル =====
const fab            = document.getElementById('fab-btn');
const composeOverlay = document.getElementById('compose-overlay');
const composeClose   = document.getElementById('compose-close');
const composeBody    = document.getElementById('compose-body');
const charBarFill    = document.getElementById('char-bar-fill');
const charCountEl    = document.getElementById('char-count');

fab.addEventListener('click', openCompose);
composeClose.addEventListener('click', closeCompose);
composeOverlay.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCompose();
});

function openCompose() {
  document.getElementById('compose-date').value = toDateStr(new Date());
  document.getElementById('compose-title').value = '';
  composeBody.value = '';
  document.getElementById('compose-json-out').style.display = 'none';
  updateCharCount();
  composeOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('compose-title').focus(), 100);
}

function closeCompose() {
  composeOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

// 文字数カウント
composeBody.addEventListener('input', updateCharCount);

function updateCharCount() {
  const count = composeBody.value.replace(/\s/g, '').length;
  const pct   = Math.min(100, count / 500 * 100);

  charBarFill.style.width = pct + '%';
  charBarFill.className   = 'char-bar-fill';
  charCountEl.className   = 'char-count';

  if (count >= 500) {
    charBarFill.classList.add('done');
    charCountEl.classList.add('done');
    charCountEl.textContent = `${count.toLocaleString()} / 500 ✓`;
  } else if (pct >= 80) {
    charBarFill.classList.add('near');
    charCountEl.textContent = `${count.toLocaleString()} / 500`;
  } else {
    charCountEl.textContent = `${count.toLocaleString()} / 500`;
  }
}

// 投稿保存
document.getElementById('compose-generate').addEventListener('click', () => {
  const title = document.getElementById('compose-title').value.trim();
  const date  = document.getElementById('compose-date').value;
  const cat   = document.getElementById('compose-cat').value;
  const body  = composeBody.value.trim();

  if (!title || !date || !body) {
    alert('タイトル・日付・本文をすべて入力してください');
    return;
  }

  // localStorage に保存
  const saved = getSavedEntries();
  const newEntry = { id: Date.now(), date, category: cat, title, body };
  saved.push(newEntry);
  saveEntries(saved);

  // allEntries に追加して再描画
  allEntries.unshift(newEntry);
  allEntries.sort((a, b) => b.date.localeCompare(a.date));
  renderEntries();
  renderCalendar();
  renderStreak();
  renderStats();

  closeCompose();

  // 完了トースト
  showToast('投稿しました！');
});

// ===== トースト通知 =====
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = [
      'position:fixed','bottom:5rem','left:50%','transform:translateX(-50%)',
      'background:#2A6049','color:#fff','font-size:0.82rem','padding:0.55rem 1.2rem',
      'border-radius:20px','z-index:300','pointer-events:none',
      'opacity:0','transition:opacity 0.2s'
    ].join(';');
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
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== 起動 =====
initCalendar();
loadEntries();
