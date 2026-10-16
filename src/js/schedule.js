/* ============================================================
   schedule.js — weekly timetable: center filter, week nav,
   class slots, booking integration, my-bookings list.
   ============================================================ */
import { CENTERS, SCHEDULE_RULES, PROGRAMS, INSTRUCTORS } from './data.js';
import { t, tf, getLang } from './i18n.js';
import { openBookingModal, cancelBooking, getBookings, isBooked, seatsTaken } from './booking.js';

const state = { center: 'all', weekOffset: 0 };

/* ---------- build the recurring weekly slot list ---------- */
function buildSlots() {
  const slots = [];
  for (const center of CENTERS) {
    if (state.center !== 'all' && center.id !== state.center) continue;
    for (const rule of SCHEDULE_RULES) {
      if (!center.programs.includes(rule.program)) continue;
      for (const day of rule.days) {
        const dur = PROGRAMS.find((p) => p.id === rule.program).duration;
        const [h, m] = rule.time.split(':').map(Number);
        const end = `${String((h + Math.floor((m + dur) / 60)) % 24).padStart(2, '0')}:${String((m + dur) % 60).padStart(2, '0')}`;
        slots.push({
          id: `${center.id}-${rule.program}-${day}`,
          centerId: center.id,
          program: rule.program,
          day,
          time: rule.time,
          end,
          capacity: rule.capacity,
          instructor: INSTRUCTORS[rule.instructor],
          taken: seatsTaken(`${center.id}-${rule.program}-${day}`, rule.capacity),
        });
      }
    }
  }
  return slots;
}

/* ---------- week date label ---------- */
function mondayOfWeek(offset) {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + offset * 7);
  return mon;
}
function fmtDate(d) {
  return d.toLocaleDateString(getLang() === 'zh' ? 'zh-HK' : 'en-GB', { month: 'short', day: 'numeric' });
}

/* ---------- render ---------- */
function renderCenterSelect() {
  const sel = document.getElementById('center-select');
  const centers = t('centers.items');
  sel.innerHTML = `<option value="all">${t('schedule.allCenters')}</option>` +
    CENTERS.map((c) => `<option value="${c.id}">${centers[c.id].name}</option>`).join('');
  sel.value = state.center;
}

function renderWeekLabel() {
  const mon = mondayOfWeek(state.weekOffset);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  document.getElementById('week-label').textContent =
    `${t('schedule.weekLabel')} ${fmtDate(mon)} – ${fmtDate(sun)}`;
  const today = new Date();
  const isThisWeek = state.weekOffset === 0;
  document.getElementById('week-today').disabled = isThisWeek;
}

function renderLegend() {
  document.getElementById('schedule-legend').innerHTML = `
    <span class="badge">${t('schedule.legend.available')}</span>
    <span class="badge badge--gold">${t('schedule.legend.booked')}</span>
    <span class="badge badge--coral">${t('schedule.legend.full')}</span>`;
}

function renderTimetable() {
  const host = document.getElementById('timetable');
  const slots = buildSlots();
  const days = t('schedule.days');
  const dayShort = t('schedule.dayShort');
  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
  const isToday = (i) => state.weekOffset === 0 && i === todayIdx;
  const copy = t('programs.items');

  host.innerHTML = days.map((day, i) => {
    const daySlots = slots.filter((s) => s.day === i);
    const dayHTML = daySlots.length
      ? daySlots.map((s) => {
          const full = s.taken >= s.capacity;
          const booked = isBooked(s.id);
          const left = s.capacity - s.taken;
          return `
          <div class="class-slot ${booked ? 'class-slot--booked' : ''}">
            <b>${copy[s.program].name}</b>
            <time>${s.time}–${s.end}</time>
            <span class="class-slot__center">${t(`centers.items.${s.centerId}.name`)}</span>
            <span class="sr-note">${s.instructor}</span>
            ${booked
              ? '<span class="class-slot__booked">✓ ' + t('schedule.booked') + '</span>'
              : full
                ? `<span class="class-slot__full">${t('schedule.full')}</span>
                   <button class="btn btn--ghost" disabled>${t('schedule.full')}</button>`
                : `<span class="sr-note">${tf('schedule.seatsLeft', { n: left })}</span>
                   <button class="btn btn--primary" data-slot="${s.id}">${t('schedule.book')}</button>`}
          </div>`;
        }).join('')
      : `<p class="form-note" style="text-align:center">${t('schedule.noClasses')}</p>`;
    return `
      <div class="timetable-col" role="group" aria-label="${day}">
        <div class="timetable-day ${isToday(i) ? 'is-today' : ''}">
          ${dayShort[i]}${isToday(i) ? ` · ${t('schedule.today')}` : ''}
        </div>
        ${dayHTML}
      </div>`;
  }).join('');
}

function renderBookings() {
  const list = document.getElementById('bookings-list');
  const empty = document.getElementById('bookings-empty');
  const count = document.getElementById('bookings-count');
  const bookings = getBookings();
  empty.hidden = bookings.length > 0;
  count.textContent = bookings.length ? tf('schedule.myBookings.count', { n: bookings.length }) : '';
  const copy = t('programs.items');
  const centers = t('centers.items');
  list.innerHTML = bookings.map((b) => {
    // slot id format: <centerId>-<programId>-<weekday> where programId
    // itself contains hyphens — so parse day from the END.
    const parts = b.slotId.split('-');
    const day = parts.pop();
    const centerId = parts[0];
    const programId = parts.slice(1).join('-');
    return `
    <li>
      <span>
        <b>${copy[programId].name}</b> · ${centers[centerId].name} · ${t('schedule.days')[Number(day)]}<br />
        <span class="sr-note">${b.name} · ${b.phone}</span>
      </span>
      <button type="button" class="btn btn--ghost cancel-btn" data-slot="${b.slotId}" data-i18n="schedule.myBookings.cancel"></button>
    </li>`;
  }).join('');
}

/* ---------- wiring ---------- */
function wire() {
  document.getElementById('center-select').addEventListener('change', (e) => {
    state.center = e.target.value;
    renderTimetable();
  });
  document.getElementById('week-prev').addEventListener('click', () => { state.weekOffset -= 1; refresh(); });
  document.getElementById('week-next').addEventListener('click', () => { state.weekOffset += 1; refresh(); });
  document.getElementById('week-today').addEventListener('click', () => { state.weekOffset = 0; refresh(); });

  document.getElementById('timetable').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-slot]');
    if (!btn) return;
    const slot = buildSlots().find((s) => s.id === btn.dataset.slot);
    if (slot) openBookingModal(slot, () => { renderTimetable(); renderBookings(); });
  });

  document.getElementById('bookings-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-slot]');
    if (!btn) return;
    cancelBooking(btn.dataset.slot, () => { renderTimetable(); renderBookings(); });
  });
}

function refresh() {
  renderWeekLabel();
  renderTimetable();
  renderBookings();
}

/* ---------- boot ---------- */
renderCenterSelect();
renderLegend();
renderWeekLabel();
renderTimetable();
renderBookings();
wire();

window.addEventListener('ffe:langchange', () => {
  renderCenterSelect();
  renderLegend();
  renderWeekLabel();
  renderTimetable();
  renderBookings();
});
