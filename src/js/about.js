/* ============================================================
   about.js — first-year goals (we currently have NO members),
   founding story, the three founders, publications (PDF) and
   cited HK health statistics.
   ============================================================ */
import { GOALS, HK_STATS } from './data.js';
import { t, tf, getLang } from './i18n.js';

const lang = () => getLang();

/* ---------- first-year goal cards ---------- */
function renderGoals() {
  const host = document.getElementById('impact-cards');
  const im = t('about.impact');
  host.innerHTML = `
    <div class="stat-card" style="background:rgba(255,255,255,0.96)"><b>${GOALS.firstMembers}</b><span>${im.firstMembers}</span></div>
    <div class="stat-card" style="background:rgba(255,255,255,0.96)"><b>${GOALS.classes}</b><span>${im.classes}</span></div>
    <div class="stat-card" style="background:rgba(255,255,255,0.96)"><b>${GOALS.volunteers}</b><span>${im.volunteers}</span></div>
    <div class="stat-card" style="background:rgba(255,255,255,0.96)"><b>−${GOALS.fallReduction}%</b><span>${im.fallReduction}</span></div>`;
}

/* ---------- founding story (plain paragraphs, no invented dates) ---------- */
function renderHistory() {
  const host = document.getElementById('history-timeline');
  host.innerHTML = t('about.history').map((text) => `<p>${text}</p>`).join('');
}

/* ---------- the three founders ---------- */
function renderBoard() {
  const host = document.getElementById('board-grid');
  host.innerHTML = t('about.board').map(([name, role]) => `
    <div class="board-card">
      <span class="avatar" style="border:none;padding:0;margin-bottom:0.4rem">
        <span class="initials" aria-hidden="true">${name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
      </span>
      <b>${name}</b>
      <span>${role}</span>
    </div>`).join('');
}

/* ---------- publications (PDF) ---------- */
function renderReports() {
  const host = document.getElementById('reports-grid');
  const files = [
    'organisation-overview.pdf',
    'program-prospectus.pdf',
    'first-year-plan.pdf',
  ];
  host.innerHTML = t('about.reports').map(([title, desc], i) => `
    <article class="card">
      <h3 class="card__title">${title}</h3>
      <p>${desc}</p>
      <div class="card__foot btn-group">
        <a class="btn btn--primary" href="/reports/${files[i]}" download>⬇ ${t('common.downloadPdf')}</a>
      </div>
    </article>`).join('');
}

/* ---------- HK statistics with citations ---------- */
function renderHKStats() {
  const host = document.getElementById('hk-stats');
  host.innerHTML = HK_STATS.map((s) => `
    <article class="card">
      <p style="font-weight:700">${lang() === 'zh' ? s.figureZh : s.figureEn}</p>
      <p class="card__meta">${t('common.source')}：${lang() === 'zh' ? s.source : s.sourceEn}</p>
      <div class="card__foot pill-row">
        ${s.urls.map((u) => `<a class="badge badge--coral" href="${u}" target="_blank" rel="noopener">↗ ${u.replace('https://', '').slice(0, 38)}…</a>`).join('')}
      </div>
    </article>`).join('');
}

/* ---------- boot ---------- */
function render() {
  renderGoals();
  renderHistory();
  renderBoard();
  renderReports();
  renderHKStats();
}
render();
window.addEventListener('ffe:langchange', render);
