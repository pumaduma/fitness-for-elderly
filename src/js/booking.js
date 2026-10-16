/* ============================================================
   booking.js — class booking: modal with confirmation,
   localStorage persistence, seat accounting.
   ============================================================ */
import { t, tf, getLang, announce } from './i18n.js';
import { createModal } from './modal.js';

const LS_KEY = 'ffe-bookings';

/* ---------- localStorage helpers ---------- */
export function getBookings() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}
function saveBookings(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* private mode */ }
}
export function isBooked(slotId) {
  return getBookings().some((b) => b.slotId === slotId);
}

/* Deterministic pseudo-random seats taken per slot (stable across reloads). */
export function seatsTaken(slotId, capacity) {
  let h = 0;
  for (const ch of slotId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Math.min(capacity, Math.floor((h % 100) / 100 * capacity));
}

/* ---------- booking modal ---------- */
const modal = createModal();

function showModalMessage(type, key) {
  const body = modal.overlay.querySelector('.modal__body');
  body.innerHTML = `<div class="banner banner--${type}">${t(key)}</div>`;
}

export function openBookingModal(slot, onChanged) {
  const copy = t(`programs.items.${slot.program}`);
  const centerName = t(`centers.items.${slot.centerId}.name`);
  const lang = getLang();
  const timeLabel = `${slot.time}–${slot.end}`;

  modal.open({
    title: t('schedule.booking.title'),
    contentHTML: `
      <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.2rem 1rem;margin-bottom:1.25rem">
        <dt style="font-weight:700">${t('schedule.booking.className')}</dt><dd>${copy.name}</dd>
        <dt style="font-weight:700">${t('schedule.booking.center')}</dt><dd>${centerName}</dd>
        <dt style="font-weight:700">${t('schedule.booking.time')}</dt><dd>${timeLabel}</dd>
        <dt style="font-weight:700">${t('schedule.booking.instructor')}</dt><dd>${slot.instructor}</dd>
      </dl>
      <form id="booking-form" novalidate>
        <div class="form-field">
          <label for="bk-name">${t('schedule.booking.name')} *</label>
          <input id="bk-name" name="name" type="text" autocomplete="name" data-i18n-attr="placeholder:schedule.booking.namePh" aria-describedby="bk-name-err" required />
          <p class="field-error" id="bk-name-err">${t('schedule.booking.errName')}</p>
        </div>
        <div class="form-field">
          <label for="bk-phone">${t('schedule.booking.phone')} *</label>
          <input id="bk-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" data-i18n-attr="placeholder:schedule.booking.phonePh" aria-describedby="bk-phone-err" required />
          <p class="field-error" id="bk-phone-err">${t('schedule.booking.errPhone')}</p>
        </div>
        <button type="submit" class="btn btn--primary" style="width:100%" data-i18n="schedule.booking.confirm"></button>
      </form>`,
  });

  const form = modal.overlay.querySelector('#booking-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isBooked(slot.id)) {
      showModalMessage('error', 'schedule.booking.duplicate');
      return;
    }
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    let ok = true;
    const nameErr = form.querySelector('#bk-name-err');
    const phoneErr = form.querySelector('#bk-phone-err');
    form.name.setAttribute('aria-invalid', 'false');
    form.phone.setAttribute('aria-invalid', 'false');
    nameErr.classList.remove('is-visible');
    phoneErr.classList.remove('is-visible');
    if (!name) {
      form.name.setAttribute('aria-invalid', 'true');
      nameErr.classList.add('is-visible');
      ok = false;
    }
    if (!/^\d{8}$/.test(phone)) {
      form.phone.setAttribute('aria-invalid', 'true');
      phoneErr.classList.add('is-visible');
      ok = false;
    }
    if (!ok) return;

    const bookings = getBookings();
    bookings.push({ slotId: slot.id, name, phone, ts: Date.now() });
    saveBookings(bookings);
    announce(t('schedule.booking.success'));
    showModalMessage('success', 'schedule.booking.success');
    modal.overlay.querySelector('.modal__foot')?.remove();
    if (onChanged) onChanged();
  });
}

export function cancelBooking(slotId, onChanged) {
  saveBookings(getBookings().filter((b) => b.slotId !== slotId));
  announce(t('schedule.myBookings.cancelled'));
  if (onChanged) onChanged();
}
