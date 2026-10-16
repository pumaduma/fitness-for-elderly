/* ============================================================
   main.js — shared shell for every page:
   header + nav (injected once), language toggle, accessibility
   toolbar (font size / high contrast / reduce motion), footer.
   All preferences persist in localStorage and are applied
   before first paint by the inline <head> boot snippet.
   ============================================================ */
import { initI18n, getLang, setLang, t, tf, applyTranslations, announce } from './i18n.js';

const A11Y_KEY = 'ffe-a11y';
const FS_STEPS = ['100', '112', '125', '137'];

/* ---------- accessibility preferences ---------- */
export function getA11yPrefs() {
  try {
    return JSON.parse(localStorage.getItem(A11Y_KEY)) || { fs: '100', contrast: false, motion: false };
  } catch {
    return { fs: '100', contrast: false, motion: false };
  }
}

export function saveA11yPrefs(prefs) {
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(prefs)); } catch { /* private mode */ }
}

export function applyA11yPrefs(prefs = getA11yPrefs()) {
  const html = document.documentElement;
  html.dataset.fs = FS_STEPS.includes(prefs.fs) ? prefs.fs : '100';
  html.classList.toggle('high-contrast', !!prefs.contrast);
  html.classList.toggle('reduce-motion', !!prefs.motion);
  window.dispatchEvent(new CustomEvent('ffe:a11ychange', { detail: prefs }));
}

/* ---------- header / nav ---------- */
const NAV_LINKS = [
  ['/', 'index.html', 'nav.home'],
  ['/programs.html', 'programs.html', 'nav.programs'],
  ['/schedule.html', 'schedule.html', 'nav.schedule'],
  ['/centers.html', 'centers.html', 'nav.centers'],
  ['/membership.html', 'membership.html', 'nav.membership'],
  ['/volunteers.html', 'volunteers.html', 'nav.volunteers'],
  ['/donate.html', 'donate.html', 'nav.donate'],
  ['/health-tools.html', 'health-tools.html', 'nav.healthTools'],
  ['/about.html', 'about.html', 'nav.about'],
  ['/contact.html', 'contact.html', 'nav.contact'],
  ['/news.html', 'news.html', 'nav.news'],
];

function buildHeader() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="container site-header__inner">
      <a class="brand" href="/index.html" aria-label="${t('brand.nameZh')} — ${t('brand.nameEn')}">
        <svg class="brand__logo" viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false">
          <circle cx="24" cy="24" r="22" fill="#0F5C5C"/>
          <path d="M24 38c-7.7 0-14-6.3-14-14 0-8.8 6.3-15 14-15s14 6.2 14 15c0 7.7-6.3 14-14 14z" fill="#E8613C"/>
          <path d="M13 24h22M24 13c3.6 6.2 3.6 15.8 0 22M24 13c-3.6 6.2-3.6 15.8 0 22" stroke="#FFF8F0" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        </svg>
        <span class="brand__text">
          <span class="brand__zh">${t('brand.nameZh')}</span>
          <span class="brand__en">${t('brand.nameEn')}</span>
        </span>
      </a>
      <div class="header-actions">
        <button type="button" class="lang-toggle" id="lang-toggle" aria-label="${t('a11y.switchLang')}">EN</button>
        <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="${t('a11y.menuOpen')}">
          <span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span>
        </button>
      </div>
      <nav class="main-nav" id="main-nav" aria-label="${t('nav.ariaLabel')}">
        <ul>
          ${NAV_LINKS.map(([path, href, key]) => `
            <li><a href="/${href}" data-i18n="${key}" ${isActive(path) ? 'aria-current="page"' : ''}>${t(key)}</a></li>`).join('')}
        </ul>
      </nav>
    </div>`;
  return header;
}

function isActive(path) {
  const p = window.location.pathname;
  return p === path || (path === '/' && (p === '/index.html' || p === '/'));
}

function wireNav(header) {
  const toggle = header.querySelector('#nav-toggle');
  const nav = header.querySelector('#main-nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? t('a11y.menuClose') : t('a11y.menuOpen'));
  });
  // Close the mobile menu after choosing a link, and on Escape.
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

/* ---------- footer ---------- */
function buildFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="container">
      <div class="site-footer__grid">
        <div>
          <h2 data-i18n="footer.aboutTitle"></h2>
          <p data-i18n="footer.about"></p>
          <p style="margin-top:0.75rem;font-size:var(--fs-small)" data-i18n="brand.orgType"></p>
        </div>
        <div>
          <h2 data-i18n="footer.quickLinks"></h2>
          <ul>
            ${NAV_LINKS.slice(1, 8).map(([, href, key]) => `<li><a href="/${href}" data-i18n="${key}"></a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h2 data-i18n="footer.contactTitle"></h2>
          <ul>
            <li><span data-i18n="footer.hotline"></span>：<a href="tel:+85223881234">2388 1234</a></li>
            <li><span data-i18n="footer.whatsapp"></span>：<a href="https://wa.me/85261234567" rel="noopener">6123 4567</a></li>
            <li><span data-i18n="footer.email"></span>：<a href="mailto:info@ffe.org.hk">info@ffe.org.hk</a></li>
            <li data-i18n="footer.address"></li>
            <li data-i18n="footer.hours"></li>
          </ul>
        </div>
        <div>
          <h2 data-i18n="footer.legal"></h2>
          <ul>
            <li><a href="/about.html#reports" data-i18n="footer.privacy"></a></li>
            <li><a href="/contact.html" data-i18n="footer.contactTitle"></a></li>
          </ul>
          <p style="margin-top:1rem;font-size:var(--fs-small)" data-i18n="footer.disclaimer"></p>
        </div>
      </div>
      <div class="site-footer__bottom">
        <span id="footer-copyright"></span>
      </div>
    </div>`;
  footer.querySelector('#footer-copyright').textContent = tf('footer.copyright', { year });
  return footer;
}

/* ---------- accessibility toolbar ---------- */
function buildToolbar() {
  const bar = document.createElement('div');
  bar.className = 'a11y-toolbar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', t('a11y.toolbar'));
  bar.innerHTML = `
    <button type="button" id="a11y-fs-down" aria-label="${t('a11y.smallerText')}">A−</button>
    <button type="button" id="a11y-fs-up" aria-label="${t('a11y.biggerText')}">A+</button>
    <button type="button" id="a11y-contrast" aria-label="${t('a11y.highContrast')}" aria-pressed="false">◐</button>
    <button type="button" id="a11y-motion" aria-label="${t('a11y.reduceMotion')}" aria-pressed="false">✦</button>
    <button type="button" id="a11y-reset" aria-label="${t('a11y.resetPrefs')}">↺</button>`;
  return bar;
}

function wireToolbar(bar) {
  const prefs = getA11yPrefs();
  const sync = () => {
    bar.querySelector('#a11y-contrast').setAttribute('aria-pressed', String(!!getA11yPrefs().contrast));
    bar.querySelector('#a11y-motion').setAttribute('aria-pressed', String(!!getA11yPrefs().motion));
  };
  const step = (dir) => {
    const p = getA11yPrefs();
    const i = FS_STEPS.indexOf(p.fs);
    const next = FS_STEPS[Math.min(FS_STEPS.length - 1, Math.max(0, i + dir))];
    p.fs = next;
    saveA11yPrefs(p);
    applyA11yPrefs(p);
    announce(tf('a11y.fontSizeOn', { pct: next }));
  };
  bar.querySelector('#a11y-fs-up').addEventListener('click', () => step(1));
  bar.querySelector('#a11y-fs-down').addEventListener('click', () => step(-1));
  bar.querySelector('#a11y-contrast').addEventListener('click', () => {
    const p = getA11yPrefs();
    p.contrast = !p.contrast;
    saveA11yPrefs(p);
    applyA11yPrefs(p);
    announce(p.contrast ? t('a11y.contrastOn') : t('a11y.contrastOff'));
    sync();
  });
  bar.querySelector('#a11y-motion').addEventListener('click', () => {
    const p = getA11yPrefs();
    p.motion = !p.motion;
    saveA11yPrefs(p);
    applyA11yPrefs(p);
    announce(p.motion ? t('a11y.motionOn') : t('a11y.motionOff'));
    sync();
  });
  bar.querySelector('#a11y-reset').addEventListener('click', () => {
    saveA11yPrefs({ fs: '100', contrast: false, motion: false });
    applyA11yPrefs({ fs: '100', contrast: false, motion: false });
    announce(t('a11y.prefsReset'));
    sync();
  });
  sync();
}

/* ---------- boot ---------- */
function boot() {
  applyA11yPrefs();
  document.body.prepend(buildHeader());
  wireNav(document.querySelector('.site-header'));

  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main-content';
  skip.setAttribute('data-i18n', 'a11y.skip');
  document.body.prepend(skip);

  const toolbar = buildToolbar();
  document.body.appendChild(toolbar);
  wireToolbar(toolbar);

  const footer = buildFooter();
  document.querySelector('main')?.insertAdjacentElement('afterend', footer);

  initI18n();

  // Re-translate injected chrome + per-page dynamic content on language change.
  window.addEventListener('ffe:langchange', () => {
    applyTranslations();
    document.getElementById('lang-toggle').textContent = getLang() === 'zh' ? 'EN' : '中文';
  });
}

boot();
