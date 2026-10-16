/* ============================================================
   home.js — Home page: N-body sim, dynamic sections
   (values, steps, highlights, founding team, news teaser).
   ============================================================ */
import { initSimulation } from './nbody.js';
import { FOUNDERS, FOUNDER_COLOR, DISTRICTS, PROGRAMS, NEWS } from './data.js';
import { t, tf, getLang, applyTranslations } from './i18n.js';

const lang = () => getLang();

/* ---------- render helper: values grid ---------- */
function renderValues() {
  const host = document.getElementById('mission-values');
  const values = t('home.mission.values');
  host.innerHTML = values.map(([title, body], i) => `
    <article class="card">
      <span class="chip chip--${['ssp', 'kt', 'st', 'tm'][i]}"></span>
      <h3 class="card__title">${title}</h3>
      <p>${body}</p>
    </article>`).join('');
}

/* ---------- how it works ---------- */
function renderSteps() {
  const host = document.getElementById('how-steps');
  host.innerHTML = t('home.howItWorks.steps').map(([title, body], i) => `
    <div class="step-row">
      <span class="step-num" aria-hidden="true">${i + 1}</span>
      <div>
        <h3 style="margin-bottom:0.25rem">${title}</h3>
        <p>${body}</p>
      </div>
    </div>`).join('');
}

/* ---------- program highlights (first 4) ---------- */
function renderHighlights() {
  const host = document.getElementById('program-highlights');
  const items = t('programs.items');
  host.innerHTML = PROGRAMS.slice(0, 4).map((p) => {
    const copy = items[p.id];
    return `
    <a class="card card--link" href="/programs.html#${p.id}">
      <span class="badge" aria-hidden="true">${p.icon} ${t(`programs.categories.${p.category}`)}</span>
      <h3 class="card__title">${copy.name}</h3>
      <p>${copy.tagline}</p>
      <p class="card__meta">${copy.when}</p>
      <div class="card__foot"><span class="btn btn--outline btn--sm" data-i18n="common.learnMore"></span></div>
    </a>`;
  }).join('');
}

/* ---------- the three founders ---------- */
function renderFounders() {
  const host = document.getElementById('founder-grid');
  const zh = lang() === 'zh';
  host.innerHTML = FOUNDERS.map((f) => `
    <article class="card">
      <div class="avatar">
        <span class="initials" aria-hidden="true">${f.en.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
        <span>${f.en}</span>
      </div>
      <p class="pill-row">
        <span class="badge">${t('sim.founder')}</span>
        <span class="badge badge--gold">${zh ? '香港國際學校' : 'Hong Kong International School'}</span>
      </p>
      <p>${zh ? f.roleZh : f.roleEn}</p>
    </article>`).join('');
}

/* ---------- news teaser (3 latest) ---------- */
function renderNewsTeaser() {
  const host = document.getElementById('news-teaser');
  const items = t('news.items');
  host.innerHTML = NEWS.slice(0, 3).map((n) => {
    const copy = items[n.slug];
    return `
    <article class="card">
      <p class="date" style="color:var(--coral-dark);font-weight:700">${copy.date}</p>
      <h3 class="card__title"><a href="/news.html#article=${n.slug}" style="color:var(--teal)">${copy.title}</a></h3>
      <p>${copy.excerpt}</p>
      <div class="card__foot"><a class="btn btn--ghost btn--sm" href="/news.html#article=${n.slug}" data-i18n="common.readMore"></a></div>
    </article>`;
  }).join('');
}

/* ---------- sim legend ---------- */
function renderLegend() {
  const host = document.getElementById('sim-legend');
  const zh = lang() === 'zh';
  const chips = Object.entries(DISTRICTS).map(([id, d]) => `
    <span><span class="chip chip--${id}"></span> ${zh ? d.name.split(' ')[0] : d.name.split(' ').slice(1).join(' ')}</span>`).join('');
  host.innerHTML = `${chips}
    <span><span class="chip" style="background:${FOUNDER_COLOR}"></span> ${t('sim.founder')}</span>
    <span><span class="chip" style="background:#F2A93B"></span> ${zh ? '社區中心 Community Center' : 'Community Center 社區中心'}</span>`;
}

/* ---------- boot ---------- */
function render() {
  renderValues();
  renderSteps();
  renderHighlights();
  renderFounders();
  renderNewsTeaser();
  renderLegend();
  applyTranslations(); // pick up static data-i18n labels inside new nodes
}

render();
initSimulation(document.getElementById('sim-stage'));

// Re-render all dynamic content when the user switches language.
window.addEventListener('ffe:langchange', render);
