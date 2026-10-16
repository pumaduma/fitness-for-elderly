/* ============================================================
   volunteer.js — role cards + volunteer application form
   (validated, persisted to localStorage).
   ============================================================ */
import { VOLUNTEER_ROLES } from './data.js';
import { t, getLang, announce } from './i18n.js';

const LS_KEY = 'ffe-volunteers';

/* ---------- role cards ---------- */
function renderRoles() {
  const host = document.getElementById('vol-roles');
  const roles = t('volunteers.roles');
  host.innerHTML = VOLUNTEER_ROLES.map((id) => `
    <article class="card">
      <h3 class="card__title">${roles[id].title}</h3>
      <p>${roles[id].desc}</p>
      <p class="card__meta"><b>${t('volunteers.commitment')}</b>：${roles[id].commitment}</p>
      <p class="card__meta">${roles[id].skills}</p>
    </article>`).join('');
}

function renderWhy() {
  const host = document.getElementById('vol-why');
  host.innerHTML = t('volunteers.why').map(([title, body], i) => `
    <div class="step-row">
      <span class="step-num" aria-hidden="true">${i + 1}</span>
      <div><h3 style="margin-bottom:0.25rem">${title}</h3><p>${body}</p></div>
    </div>`).join('');
}

/* ---------- form ---------- */
const form = document.getElementById('volunteer-form');

function initSelect() {
  const sel = form.role;
  const roles = t('volunteers.roles');
  sel.innerHTML = `<option value="" disabled selected>${t('volunteers.form.rolePh')}</option>` +
    VOLUNTEER_ROLES.map((id) => `<option value="${id}">${roles[id].title}</option>`).join('');
}

function toggleErr(el, show) { el.classList.toggle('is-visible', !!show); }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  const name = form.name;
  const phone = form.phone;
  const role = form.role;
  [name, phone, role].forEach((f) => f.setAttribute('aria-invalid', 'false'));
  toggleErr(document.getElementById('v-name-err'), false);
  toggleErr(document.getElementById('v-phone-err'), false);
  toggleErr(document.getElementById('v-role-err'), false);
  toggleErr(document.getElementById('v-consent-err'), false);

  if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('v-name-err'), true); ok = false; }
  if (!/^\d{8}$/.test(phone.value.trim())) { phone.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('v-phone-err'), true); ok = false; }
  if (!role.value) { role.setAttribute('aria-invalid', 'true'); toggleErr(document.getElementById('v-role-err'), true); ok = false; }
  if (!form.consent.checked) { toggleErr(document.getElementById('v-consent-err'), true); ok = false; }
  if (!ok) { announce(t('common.errorInvalid')); return; }

  const record = {
    name: name.value.trim(),
    phone: phone.value.trim(),
    email: form.email.value.trim(),
    role: role.value,
    availability: [...form.querySelectorAll('input[name="avail"]:checked')].map((i) => i.value),
    experience: form.experience.value.trim(),
    ts: Date.now(),
  };
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    all.push(record);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch { /* private mode */ }

  form.reset();
  const banner = document.getElementById('v-success');
  banner.hidden = false;
  announce(t('volunteers.form.success'));
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

form.consent.addEventListener('change', () => toggleErr(document.getElementById('v-consent-err'), false));

/* ---------- boot ---------- */
renderWhy();
renderRoles();
initSelect();

window.addEventListener('ffe:langchange', () => { renderWhy(); renderRoles(); initSelect(); });
