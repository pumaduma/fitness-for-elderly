/* ============================================================
   contact.js — contact form with validation, FAQ accordion
   (keyboard accessible), messages persisted to localStorage.
   ============================================================ */
import { t, getLang, announce, applyTranslations } from './i18n.js';

const LS_KEY = 'ffe-messages';
const form = document.getElementById('contact-form');

/* ---------- topic select ---------- */
function initSelect() {
  const sel = form.topic;
  sel.innerHTML = `<option value="" disabled selected>—</option>` +
    t('contact.topics').map((topic) => `<option>${topic}</option>`).join('');
}

/* ---------- FAQ accordion ---------- */
function renderFAQ() {
  const host = document.getElementById('faq-list');
  host.innerHTML = t('contact.faqs').map(([q, a], i) => `
    <div class="accordion-item">
      <h3>
        <button type="button" aria-expanded="false" aria-controls="faq-panel-${i}" id="faq-btn-${i}">
          <span>${q}</span><span class="chev" aria-hidden="true">›</span>
        </button>
      </h3>
      <div class="accordion-panel" id="faq-panel-${i}" hidden>${a}</div>
    </div>`).join('');

  host.addEventListener('click', (e) => {
    const btn = e.target.closest('button[aria-expanded]');
    if (!btn) return;
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
  });
}

/* ---------- validation + submit ---------- */
function toggleErr(el, show) { el.classList.toggle('is-visible', !!show); }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  const name = form.name;
  const phone = form.phone;
  const email = form.email;
  const topic = form.topic;
  const message = form.message;

  [name, topic, message].forEach((f) => f.setAttribute('aria-invalid', 'false'));
  toggleErr(document.getElementById('c-name-err'), false);
  toggleErr(document.getElementById('c-contact-err'), false);
  toggleErr(document.getElementById('c-topic-err'), false);
  toggleErr(document.getElementById('c-message-err'), false);

  if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('c-name-err'), true); ok = false; }
  const phoneOk = /^\d{8}$/.test(phone.value.trim());
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  if (!phoneOk && !emailOk) { toggleErr(document.getElementById('c-contact-err'), true); ok = false; }
  if (!topic.value) { topic.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('c-topic-err'), true); ok = false; }
  if (!message.value.trim()) { message.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('c-message-err'), true); ok = false; }
  if (!ok) { announce(t('common.errorInvalid')); return; }

  const record = {
    name: name.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    topic: topic.value,
    message: message.value.trim(),
    ts: Date.now(),
  };
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    all.push(record);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch { /* private mode */ }

  form.reset();
  const banner = document.getElementById('c-success');
  banner.hidden = false;
  announce(t('contact.success'));
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* ---------- boot ---------- */
initSelect();
renderFAQ();
window.addEventListener('ffe:langchange', () => { initSelect(); renderFAQ(); applyTranslations(); });
