/* ===== リセット & ベース ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #F7F6F3;
  --surface:   #FFFFFF;
  --border:    #E2E0DA;
  --text:      #1E1D1B;
  --text-sub:  #6B6860;
  --text-hint: #A09E99;
  --accent:    #2A6049;
  --accent-lt: #EAF2EE;
  --accent-md: #4A8C6A;
  --warn:      #C45A2A;
  --warn-lt:   #FDF0EA;
  --serif:     'Noto Serif JP', serif;
  --sans:      'Noto Sans JP', sans-serif;
  --radius:    6px;
  --radius-lg: 10px;
  --shadow:    0 1px 4px rgba(0,0,0,0.06);
}

html { font-size: 16px; scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-weight: 300;
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}

/* ===== レイアウト ===== */
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 2rem;
  padding: 2rem 0 4rem;
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
    padding: 1.25rem 0 5rem;
  }
  .sidebar { order: -1; }
}

/* ===== ヘッダー ===== */
.site-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  flex-wrap: wrap;
}

.site-title h1 {
  font-family: var(--serif);
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text);
}

.site-tagline {
  font-size: 0.72rem;
  color: var(--text-hint);
  margin-top: 2px;
  letter-spacing: 0.03em;
}

.site-nav {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.nav-btn {
  background: none;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 0.3rem 0.85rem;
  font-family: var(--sans);
  font-size: 0.78rem;
  font-weight: 300;
  color: var(--text-sub);
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover { border-color: var(--border); color: var(--text); }
.nav-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 400;
}

/* ===== 記事カード ===== */
.entry-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.4rem 1.6rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}

.entry-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.55rem;
  flex-wrap: wrap;
}

.entry-date {
  font-size: 0.75rem;
  color: var(--text-hint);
  font-feature-settings: "tnum";
}

.cat-badge {
  font-size: 0.68rem;
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  color: var(--text-sub);
  background: var(--bg);
}

.achieved-badge {
  font-size: 0.68rem;
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  background: var(--accent-lt);
  color: var(--accent);
  border: 1px solid var(--accent-md);
}

.entry-title {
  font-family: var(--serif);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--text);
  margin-bottom: 0.4rem;
  line-height: 1.5;
}

.entry-excerpt {
  font-size: 0.84rem;
  color: var(--text-sub);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--border);
}

.char-mini-bar {
  flex: 1;
  max-width: 140px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.char-mini-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
  transition: width 0.4s;
}

.char-mini-fill.over { background: var(--accent-md); }

.entry-chars {
  font-size: 0.72rem;
  color: var(--text-hint);
  margin-left: 0.5rem;
  font-feature-settings: "tnum";
}

.no-entries {
  text-align: center;
  color: var(--text-hint);
  font-size: 0.9rem;
  padding: 3rem 0;
}

/* ===== サイドバー ===== */
.sidebar { display: flex; flex-direction: column; gap: 1rem; }

.widget {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.2rem 1.3rem;
}

.widget-title {
  font-family: var(--serif);
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--text-sub);
  letter-spacing: 0.05em;
  margin-bottom: 0.9rem;
  text-transform: none;
}

/* 連続記録 */
.streak-display {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.streak-number {
  font-family: var(--serif);
  font-size: 2.8rem;
  font-weight: 300;
  color: var(--accent);
  line-height: 1;
}

.streak-label {
  font-size: 0.85rem;
  color: var(--text-sub);
}

.streak-sub {
  font-size: 0.75rem;
  color: var(--text-hint);
  min-height: 1.2em;
}

/* カレンダー */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
}

.calendar-header .widget-title { margin-bottom: 0; }

.cal-nav-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}

.cal-nav-btn:hover { background: var(--bg); }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 0.7rem;
}

.cal-day-header {
  font-size: 0.62rem;
  color: var(--text-hint);
  text-align: center;
  padding: 2px 0 4px;
}

.cal-day {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  color: var(--text-hint);
  position: relative;
}

.cal-day.has-post {
  background: var(--accent-lt);
  color: var(--accent);
  font-weight: 500;
}

.cal-day.achieved {
  background: var(--accent);
  color: #fff;
  font-weight: 500;
}

.cal-day.today {
  outline: 1.5px solid var(--accent-md);
  outline-offset: 1px;
}

.cal-day.other-month { color: #D0CEC9; }

.calendar-legend {
  display: flex;
  gap: 0.8rem;
  font-size: 0.68rem;
  color: var(--text-hint);
  align-items: center;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

.legend-dot.posted { background: var(--accent-lt); border: 1px solid var(--accent-md); }
.legend-dot.achieved { background: var(--accent); }

/* 統計 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-num {
  font-family: var(--serif);
  font-size: 1.6rem;
  font-weight: 300;
  color: var(--text);
  line-height: 1;
}

.stat-lbl {
  font-size: 0.65rem;
  color: var(--text-hint);
  text-align: center;
}

/* ===== モーダル ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30,29,27,0.55);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.modal-box {
  background: var(--surface);
  border-radius: var(--radius-lg);
  max-width: 640px;
  width: 100%;
  padding: 2rem;
  position: relative;
  margin: auto;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-meta {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.modal-date { font-size: 0.78rem; color: var(--text-hint); }
.modal-cat {
  font-size: 0.7rem;
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  color: var(--text-sub);
  background: var(--bg);
}

.modal-chars { font-size: 0.72rem; color: var(--text-hint); }

.modal-title {
  font-family: var(--serif);
  font-size: 1.3rem;
  font-weight: 400;
  line-height: 1.5;
  margin-bottom: 1.2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.modal-body {
  font-size: 0.92rem;
  line-height: 2;
  color: var(--text);
  white-space: pre-wrap;
}

/* ===== 投稿FAB ===== */
.fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(42,96,73,0.35);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, box-shadow 0.15s;
}

.fab:hover {
  transform: scale(1.06);
  box-shadow: 0 6px 20px rgba(42,96,73,0.4);
}

/* ===== 投稿パネル ===== */
.compose-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30,29,27,0.55);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 600px) {
  .compose-overlay { align-items: center; }
}

.compose-box {
  background: var(--surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  width: 100%;
  max-width: 600px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 1.5rem 1.5rem 2rem;
}

@media (min-width: 600px) {
  .compose-box { border-radius: var(--radius-lg); }
}

.compose-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

.compose-heading {
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 400;
}

.compose-close {
  background: none;
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
}

.compose-fields { display: flex; flex-direction: column; gap: 0.75rem; }

.compose-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.65rem 0.9rem;
  font-family: var(--sans);
  font-size: 0.9rem;
  font-weight: 300;
  color: var(--text);
  background: var(--bg);
  outline: none;
  transition: border-color 0.15s;
}

.compose-input:focus { border-color: var(--accent-md); background: var(--surface); }

.compose-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.textarea-wrap { position: relative; }

.compose-textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.75rem 0.9rem;
  font-family: var(--sans);
  font-size: 0.9rem;
  font-weight: 300;
  color: var(--text);
  background: var(--bg);
  resize: vertical;
  outline: none;
  line-height: 1.8;
  transition: border-color 0.15s;
}

.compose-textarea:focus { border-color: var(--accent-md); background: var(--surface); }

/* 文字数ゲージ */
.char-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.char-bar-track {
  flex: 1;
  height: 5px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.char-bar-fill {
  height: 100%;
  width: 0%;
  border-radius: 3px;
  background: var(--accent);
  transition: width 0.2s, background 0.2s;
}

.char-bar-fill.near { background: #E0A020; }
.char-bar-fill.done { background: var(--accent); }
.char-bar-fill.over { background: var(--accent-md); }

.char-count {
  font-size: 0.75rem;
  color: var(--text-hint);
  white-space: nowrap;
  font-feature-settings: "tnum";
  min-width: 56px;
  text-align: right;
}

.char-count.done { color: var(--accent); font-weight: 500; }

/* JSON出力 */
.compose-footer {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.compose-hint {
  font-size: 0.75rem;
  color: var(--text-hint);
  line-height: 1.5;
}

.compose-hint code {
  font-size: 0.72rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
  color: var(--accent);
}

.compose-generate {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.7rem 1.2rem;
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.15s;
  align-self: flex-end;
}

.compose-generate:hover { background: var(--accent-md); }

.compose-json-out {
  margin-top: 1rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
}

.json-label {
  font-size: 0.75rem;
  color: var(--text-sub);
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.json-label code {
  font-size: 0.72rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
  color: var(--accent);
}

.json-pre {
  font-size: 0.78rem;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
  margin-bottom: 0.75rem;
  font-family: monospace;
}

.copy-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.4rem 0.9rem;
  font-family: var(--sans);
  font-size: 0.8rem;
  color: var(--text-sub);
  cursor: pointer;
  transition: background 0.1s;
}

.copy-btn:hover { background: var(--accent-lt); color: var(--accent); }
