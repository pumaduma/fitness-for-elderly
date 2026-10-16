/* ============================================================
   programs.js — Program catalog with live search + category
   filters. Renders cards from PROGRAMS data × locale copy.
   ============================================================ */
import { PROGRAMS } from './data.js';
import { t, tf, getLang } from './i18n.js';

const state = { category: 'all', query: '' };

function cardHTML(p) {
  const copy = t(`programs.items.${p.id}`);
  const tags = p.tags.map((tag) => `<span class="badge badge--gold">${t(`programs.tags.${tag}`)}</span>`).join('');
  return `
  <article class="card" id="${p.id}">
    <div class="program-card__tags">
      <span class="badge" aria-hidden="true">${p.icon} ${t(`programs.categories.${p.category}`)}</span>
      <span class="badge badge--coral">${t(`programs.intensity.${p.intensity}`)}</span>
    </div>
    <h2 class="card__title">${copy.name}</h2>
    <p style="font-weight:700;color:var(--coral-dark)">${copy.tagline}</p>
    <p>${copy.desc}</p>
    <div class="program-card__tags" aria-label="${t('programs.meta.schedule')}">${tags}</div>
    <dl class="card__meta" style="display:grid;grid-template-columns:auto 1fr;gap:0.15rem 0.9rem;margin:0">
      <dt style="font-weight:700">${t('programs.meta.schedule')}</dt><dd>${copy.when}</dd>
      <dt style="font-weight:700">${t('programs.meta.location')}</dt><dd>${copy.where}</dd>
      <dt style="font-weight:700">${t('programs.meta.suitable')}</dt><dd>${copy.suitable}</dd>
      <dt style="font-weight:700">${t('programs.meta.fee')}</dt><dd>${t('programs.meta.feeValue')}</dd>
      <dt style="font-weight:700">${t('programs.meta.classSize')}</dt><dd>${t('programs.meta.classSizeValue')}</dd>
    </dl>
    ${copy.enrollNote ? `<p class="form-note" style="margin:0">${copy.enrollNote}</p>` : ''}
    <div class="card__foot btn-group">
      <a class="btn btn--primary" href="/schedule.html">${t('common.bookNow')}</a>
      <a class="btn btn--ghost" href="/membership.html" data-i18n="home.hero.ctaJoin"></a>
    </div>
  </article>`;
}

function renderFilters() {
  const host = document.getElementById('program-filters');
  const cats = [['all', t('programs.all')], ...Object.entries(t('programs.categories')).map(([k, v]) => [k, v])];
  host.innerHTML = cats.map(([id, label]) => `
    <button type="button" class="filter-pill" data-cat="${id}" aria-pressed="${state.category === id}">${label}</button>`).join('');
}

function render() {
  const copy = t('programs.items');
  const q = state.query.trim().toLowerCase();
  const filtered = PROGRAMS.filter((p) => {
    const inCat = state.category === 'all' || p.category === state.category;
    const haystack = `${copy[p.id].name} ${copy[p.id].tagline} ${copy[p.id].desc} ${t(`programs.categories.${p.category}`)}`.toLowerCase();
    return inCat && (!q || haystack.includes(q));
  });
  document.getElementById('result-count').textContent = tf('programs.resultCount', { n: filtered.length });
  document.getElementById('no-results').hidden = filtered.length > 0;
  document.getElementById('program-list').innerHTML = filtered.map(cardHTML).join('');

  // Deep-link support: /programs.html#aqua-fitness scrolls & highlights.
  const hash = decodeURIComponent(window.location.hash.replace('#', ''));
  if (hash && document.getElementById(hash)) {
    const el = document.getElementById(hash);
    el.style.outline = '3px solid var(--gold)';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function wire() {
  document.getElementById('program-search').addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
  });
  document.getElementById('program-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-pill');
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderFilters();
    render();
  });
}

wire();
render();
window.addEventListener('ffe:langchange', () => { renderFilters(); render(); });
