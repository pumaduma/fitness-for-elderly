/* ============================================================
   donate.js — tiered giving options, payment-method details,
   donor form with validation. Demo mode: no real charges.
   ============================================================ */
import { DONATION_TIERS } from './data.js';
import { t, getLang, announce } from './i18n.js';

const LS_KEY = 'ffe-donations';
const form = document.getElementById('donate-form');

/* ---------- impact cards ---------- */
function renderImpact() {
  const host = document.getElementById('donate-impact');
  host.innerHTML = t('donate.how').map(([amount, impact]) => `
    <article class="card" style="text-align:center">
      <b style="font-size:1.9rem;color:var(--teal)">${amount}</b>
      <p>${impact}</p>
    </article>`).join('');
}

/* ---------- tiers ---------- */
function renderTiers() {
  const host = document.getElementById('donate-tiers');
  const impact = t('donate.how');
  host.innerHTML = DONATION_TIERS.map((tier) => `
    <label class="tier">
      <input type="radio" name="amount" value="${tier.amount}" />
      <b class="amount">$${tier.amount}</b>
      <span class="impact">${impact[tier.noteKey.split('.')[1]][1]}</span>
    </label>`).join('');
}

/* ---------- payment details ---------- */
function renderPayDetail() {
  const val = form.querySelector('input[name="pay"]:checked')?.value || 'fps';
  document.getElementById('pay-detail').textContent = t(`donate.${val}Detail`);
}

/* ---------- validation + submit ---------- */
function toggleErr(el, show) { el.classList.toggle('is-visible', !!show); }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  const amountEl = form.querySelector('input[name="amount"]:checked');
  const custom = form.querySelector('#custom-amount');
  const name = form.name;
  const email = form.email;

  [name, email].forEach((f) => f.setAttribute('aria-invalid', 'false'));
  toggleErr(document.getElementById('d-name-err'), false);
  toggleErr(document.getElementById('d-email-err'), false);
  toggleErr(document.getElementById('amount-err'), false);

  let amount = null;
  if (amountEl && amountEl.value !== 'custom') amount = Number(amountEl.value);
  else if (amountEl && amountEl.value === 'custom') amount = Number(custom.value);
  if (!amount || amount < 10) { toggleErr(document.getElementById('amount-err'), true); ok = false; }

  if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('d-name-err'), true); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    email.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('d-email-err'), true); ok = false;
  }
  if (!ok) { announce(t('common.errorInvalid')); return; }

  const record = {
    freq: form.querySelector('input[name="freq"]:checked').value,
    amount,
    pay: form.querySelector('input[name="pay"]:checked').value,
    name: name.value.trim(),
    email: email.value.trim(),
    phone: form.phone.value.trim(),
    anonymous: form.anonymous.checked,
    receipt: form.receipt.checked,
    ts: Date.now(),
  };
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    all.push(record);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch { /* private mode */ }

  document.getElementById('d-success').hidden = false;
  announce(`${t('donate.success')} ${t('donate.successBody')}`);
  document.getElementById('d-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

form.addEventListener('change', (e) => {
  if (e.target.name === 'pay') renderPayDetail();
});

/* ---------- boot ---------- */
renderImpact();
renderTiers();
renderPayDetail();
window.addEventListener('ffe:langchange', () => { renderImpact(); renderTiers(); renderPayDetail(); });
