/* ============================================================
   membership.js — multi-step membership wizard with validation
   and an eligibility check (age 60+, HK resident, medical).
   Submissions are stored in localStorage (no backend in this
   demo build — swap the save() call for your API later).
   ============================================================ */
import { PROGRAMS, HK_DISTRICTS } from './data.js';
import { t, tf, getLang, announce, applyTranslations } from './i18n.js';

const LS_KEY = 'ffe-memberships';
const TOTAL_STEPS = 4;

const form = document.getElementById('membership-form');
const data = { memberType: 'senior', programs: [] };

/* ---------- helpers ---------- */
function showError(el, show) {
  if (el) el.classList.toggle('is-visible', !!show);
}
function calcAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age -= 1;
  return age;
}

/* ---------- progress ---------- */
function renderProgress(step) {
  const host = document.getElementById('wizard-progress');
  const names = t('membership.stepNames');
  host.innerHTML = names.map((name, i) => {
    const n = i + 1;
    const cls = n < step ? ' is-done' : '';
    const current = n === step ? ' aria-current="step"' : '';
    return `
      ${i > 0 ? '<span class="wizard-connector ' + (n <= step ? 'is-done' : '') + '" aria-hidden="true"></span>' : ''}
      <span class="wizard-step-chip${cls}"${current}>
        ${n < step ? '✓ ' : ''}${n}. ${name}
      </span>`;
  }).join('');
  document.getElementById('wizard-status').textContent = tf('membership.progress', { current: Math.min(step, TOTAL_STEPS), total: TOTAL_STEPS });
}

/* ---------- panel navigation ---------- */
let step = 1;
function showStep(n) {
  step = n;
  form.querySelectorAll('.wizard-panel').forEach((p) => {
    p.hidden = Number(p.dataset.step) !== step;
  });
  document.getElementById('wiz-prev').hidden = step === 1 || step > TOTAL_STEPS;
  document.getElementById('wiz-next').hidden = step >= TOTAL_STEPS;
  document.getElementById('wiz-submit').hidden = step !== TOTAL_STEPS;
  if (step === TOTAL_STEPS) renderReview();
  renderProgress(step);
}

/* ---------- step 1: eligibility ---------- */
function validateStep1() {
  const age = form.querySelector('input[name="age60"]:checked');
  const hkid = form.querySelector('input[name="hkid"]:checked');
  const medical = form.querySelector('input[name="medical"]:checked');
  if (!age || !hkid || !medical) {
    announce(t('schedule.booking.fillAll'));
    return false;
  }
  const note = document.getElementById('elig-note');
  if (hkid.value === 'no') {
    const proceed = form.querySelector('input[name="continue-anyway"]');
    note.hidden = false;
    note.innerHTML = `
      <p>${tf('membership.eligibility.notEligible', { phone: '2388 1234' })}</p>
      ${proceed ? '' : `<label class="check-row mt-1"><input type="checkbox" name="continue-anyway" /><span>${t('membership.eligibility.continueAnyway')}</span></label>`}`;
    const cb = form.querySelector('input[name="continue-anyway"]');
    if (!cb.checked) {
      cb?.addEventListener('change', () => { note.hidden = true; });
      return false;
    }
    return true;
  }
  if (age.value === 'no') {
    note.hidden = false;
    note.innerHTML = `<p>${t('membership.eligibility.under60')}</p>`;
    data.memberType = 'friend';
  } else {
    data.memberType = 'senior';
  }
  if (medical.value === 'yes') {
    note.hidden = false;
    note.innerHTML += `<p>${t('membership.eligibility.medicalNote')}</p>`;
  }
  if (age.value === 'yes' && medical.value === 'no') note.hidden = true;
  return true;
}

/* ---------- step 2: personal details ---------- */
function validateStep2() {
  let ok = true;
  const name = form.name;
  const dob = form.dob;
  const phone = form.phone;
  const district = form.district;
  const consent = form.consent;

  name.setAttribute('aria-invalid', 'false');
  dob.setAttribute('aria-invalid', 'false');
  phone.setAttribute('aria-invalid', 'false');
  showError(document.getElementById('m-name-err'), false);
  showError(document.getElementById('m-dob-err'), false);
  showError(document.getElementById('m-dob-future'), false);
  showError(document.getElementById('m-phone-err'), false);
  showError(document.getElementById('m-consent-err'), false);

  if (!name.value.trim()) {
    name.setAttribute('aria-invalid', 'true');
    showError(document.getElementById('m-name-err'), true);
    ok = false;
  }
  if (!dob.value) {
    dob.setAttribute('aria-invalid', 'true');
    showError(document.getElementById('m-dob-err'), true);
    ok = false;
  } else if (new Date(dob.value) > new Date()) {
    dob.setAttribute('aria-invalid', 'true');
    showError(document.getElementById('m-dob-future'), true);
    ok = false;
  }
  if (!/^\d{8}$/.test(phone.value.trim())) {
    phone.setAttribute('aria-invalid', 'true');
    showError(document.getElementById('m-phone-err'), true);
    ok = false;
  }
  if (!district.value) {
    district.setAttribute('aria-invalid', 'true');
    ok = false;
  }
  if (!consent.checked) {
    showError(document.getElementById('m-consent-err'), true);
    ok = false;
  }
  if (!ok) announce(t('common.errorInvalid'));
  return ok;
}

/* ---------- step 3: choose programs ---------- */
function renderProgramChoices() {
  const host = document.getElementById('m-programs');
  const copy = t('programs.items');
  host.innerHTML = PROGRAMS.map((p) => `
    <label class="check-row check-row--boxed card" style="padding:0.9rem 1rem">
      <input type="checkbox" name="program" value="${p.id}" ${data.programs.includes(p.id) ? 'checked' : ''} />
      <span>
        <b style="color:var(--teal)">${p.icon} ${copy[p.id].name}</b><br />
        <span class="sr-note">${copy[p.id].tagline}</span>
      </span>
    </label>`).join('');
}

/* ---------- step 4: review ---------- */
function renderReview() {
  const host = document.getElementById('m-review');
  const copy = t('programs.items');
  const selected = [...form.querySelectorAll('input[name="program"]:checked')].map((i) => i.value);
  host.innerHTML = `
    <dt style="font-weight:700">${t('membership.review.nameLabel')}</dt><dd>${form.name.value}${form.nameEn.value ? ` (${form.nameEn.value})` : ''}</dd>
    <dt style="font-weight:700">${t('membership.review.dobLabel')}</dt><dd>${form.dob.value}</dd>
    <dt style="font-weight:700">${t('membership.review.phoneLabel')}</dt><dd>${form.phone.value}</dd>
    <dt style="font-weight:700">${t('membership.review.districtLabel')}</dt><dd>${form.district.value}</dd>
    <dt style="font-weight:700">${t('membership.review.programsLabel')}</dt>
    <dd>${selected.length ? selected.map((id) => copy[id].name).join('、') : t('membership.review.none')}</dd>
    <dt style="font-weight:700">${t('membership.review.consentLabel')}</dt><dd>${t('membership.review.agreed')}</dd>`;
}

/* ---------- submit ---------- */
function save() {
  const record = {
    memberType: data.memberType,
    name: form.name.value.trim(),
    nameEn: form.nameEn.value.trim(),
    dob: form.dob.value,
    age: calcAge(form.dob.value),
    phone: form.phone.value.trim(),
    district: form.district.value,
    emergency: form.emergency.value.trim(),
    programs: [...form.querySelectorAll('input[name="program"]:checked')].map((i) => i.value),
    consent: true,
    ts: Date.now(),
  };
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    all.push(record);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch { /* private mode — continue in-memory only */ }
  document.getElementById('m-success-body').textContent = tf('membership.success.body', { phone: '2388 1234' });
  showStep(5);
  announce(t('membership.success.title'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- wiring ---------- */
document.getElementById('wiz-next').addEventListener('click', () => {
  const valid = step === 1 ? validateStep1() : step === 2 ? validateStep2() : true;
  if (valid) showStep(step + 1);
});
document.getElementById('wiz-prev').addEventListener('click', () => showStep(step - 1));
form.addEventListener('submit', (e) => { e.preventDefault(); save(); });

/* Re-validate consent error as it changes */
form.consent.addEventListener('change', () => {
  showError(document.getElementById('m-consent-err'), false);
});

/* ---------- boot ---------- */
(function init() {
  const sel = form.district;
  sel.innerHTML = `<option value="" disabled selected>${t('membership.personal.district')}</option>` +
    HK_DISTRICTS.map((d) => `<option>${d}</option>`).join('');
  renderProgramChoices();
  showStep(1);
})();

window.addEventListener('ffe:langchange', () => {
  renderProgress(step);
  renderProgramChoices();
  if (step === TOTAL_STEPS) renderReview();
  applyTranslations();
});
