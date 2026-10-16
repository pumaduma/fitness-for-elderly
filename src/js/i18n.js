/* ============================================================
   i18n — tiny, dependency-free internationalisation engine.
   Strings live in src/locales/{zh,en}.js as nested objects.
   Pages reference content by key: data-i18n="hero.title",
   data-i18n-attr="placeholder:programs.searchPlaceholder".
   ============================================================ */
import zh from '../locales/zh.js';
import en from '../locales/en.js';

const LANGS = { zh, en };
export const DEFAULT_LANG = 'zh';
const STORE_KEY = 'ffe-lang';

export function getLang() {
  try {
    return localStorage.getItem(STORE_KEY) || DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function setLang(lang) {
  const next = LANGS[lang] ? lang : DEFAULT_LANG;
  try { localStorage.setItem(STORE_KEY, next); } catch { /* private mode */ }
  document.documentElement.lang = next === 'zh' ? 'zh-Hant' : 'en';
  applyTranslations();
  // Let page modules re-render dynamic content in the new language.
  window.dispatchEvent(new CustomEvent('ffe:langchange', { detail: { lang: next } }));
  announce(t('a11y.langChanged'));
}

/** Resolve a dotted key like "home.hero.title" to its string. */
export function t(key) {
  const dict = LANGS[getLang()] || zh;
  return key.split('.').reduce((obj, k) => (obj && obj[k] != null ? obj[k] : undefined), dict)
    ?? key.split('.').reduce((obj, k) => (obj && obj[k] != null ? obj[k] : undefined), zh)
    ?? key;
}

/** Interpolate {placeholders} — e.g. t('x', {n: 5}) */
export function tf(key, vars = {}) {
  return t(key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}

/** Walk the DOM and translate every [data-i18n] / [data-i18n-attr] node. */
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
  document.title = `${t('brand.nameZh')} · ${t('brand.nameEn')} — ${t(`meta.title.${pageId()}`)}`;
}

function pageId() {
  const id = document.body.dataset.page || 'home';
  return id;
}

/** Announce a message to screen-reader users via the live region. */
export function announce(msg) {
  let live = document.getElementById('live-region');
  if (!live) {
    live = document.createElement('div');
    live.id = 'live-region';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('role', 'status');
    document.body.appendChild(live);
  }
  live.textContent = '';
  window.setTimeout(() => { live.textContent = msg; }, 60);
}

export function initI18n() {
  const lang = getLang();
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.textContent = lang === 'zh' ? 'EN' : '中文';
    toggle.setAttribute('aria-label', t('a11y.switchLang'));
    toggle.addEventListener('click', () => {
      // IMPORTANT: read the *current* language at click time (the
      // value captured at init goes stale after the first toggle).
      setLang(getLang() === 'zh' ? 'en' : 'zh');
      toggle.textContent = getLang() === 'zh' ? 'EN' : '中文';
    });
  }
  applyTranslations();
}
