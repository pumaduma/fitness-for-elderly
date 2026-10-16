/* ============================================================
   news.js — news listing with category filters + full article
   view. Articles are deep-linkable via #article=<slug>.
   ============================================================ */
import { NEWS } from './data.js';
import { t, getLang, announce } from './i18n.js';

const state = { category: 'all', article: null };

function currentSlug() {
  const m = window.location.hash.match(/^#article=([\w-]+)/);
  return m ? m[1] : null;
}

/* ---------- listing ---------- */
function renderFilters() {
  const host = document.getElementById('news-filters');
  const cats = [['all', t('news.title')], ...Object.entries(t('news.categories'))];
  host.innerHTML = cats.map(([id, label]) => `
    <button type="button" class="filter-pill" data-cat="${id}" aria-pressed="${state.category === id}">${label}</button>`).join('');
}

function renderList() {
  const host = document.getElementById('news-list');
  const items = t('news.items');
  const filtered = NEWS.filter((n) => state.category === 'all' || n.category === state.category);
  host.innerHTML = filtered.map((n) => {
    const a = items[n.slug];
    return `
    <article class="news-card card">
      <p class="date">${a.date} · <span class="badge badge--coral">${t(`news.categories.${n.category}`)}</span></p>
      <h2><a href="/news.html#article=${n.slug}">${a.title}</a></h2>
      <p>${a.excerpt}</p>
      <div class="card__foot">
        <a class="btn btn--ghost btn--sm" href="/news.html#article=${n.slug}" data-i18n="common.readMore"></a>
      </div>
    </article>`;
  }).join('');
}

/* ---------- article view ---------- */
function renderArticle(slug) {
  const copy = t('news.items')[slug];
  if (!copy) { showListing(); return; }
  state.article = slug;
  document.getElementById('news-listing').hidden = true;
  const section = document.getElementById('news-article');
  section.hidden = false;

  const blocks = copy.body.map((b) => {
    if (b.type === 'h2') return `<h2>${b.text}</h2>`;
    if (b.type === 'quote') return `<blockquote>${b.text}</blockquote>`;
    if (b.type === 'ul') return `<ul>${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    return `<p>${b.text}</p>`;
  }).join('');

  document.getElementById('article-body').innerHTML = `
    <p class="byline"><span class="badge">${t(`news.categories.${copy.category}`)}</span>
      · ${t('news.dateLabel')}：${copy.date} · ${t('news.authorLabel')}：${copy.author}</p>
    <h1>${copy.title}</h1>
    ${blocks}
    <div class="mt-2">
      <button type="button" class="btn btn--ghost btn--sm" id="copy-link" data-i18n="news.copyLink"></button>
    </div>`;

  document.getElementById('copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      announce(t('news.linkCopied'));
    } catch { /* clipboard unavailable — no-op */ }
  });

  window.scrollTo({ top: 0 });
  section.querySelector('h1')?.setAttribute('tabindex', '-1');
  section.querySelector('h1')?.focus();
}

function showListing() {
  state.article = null;
  document.getElementById('news-listing').hidden = false;
  document.getElementById('news-article').hidden = true;
}

/* ---------- boot ---------- */
function boot() {
  renderFilters();
  renderList();
  const slug = currentSlug();
  if (slug) renderArticle(slug);
  else showListing();
}

document.getElementById('news-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-pill');
  if (!btn) return;
  state.category = btn.dataset.cat;
  renderFilters();
  renderList();
});

window.addEventListener('hashchange', () => {
  const slug = currentSlug();
  if (slug) renderArticle(slug);
  else showListing();
});

window.addEventListener('ffe:langchange', () => {
  boot();
});

boot();
