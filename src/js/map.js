/* ============================================================
   map.js — interactive Leaflet + OpenStreetMap of our 6 centers.
   Markers are mirrored by an accessible card list for
   keyboard / screen-reader users (WCAG 2.1.1).
   ============================================================ */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTERS, DISTRICTS } from './data.js';
import { t, getLang } from './i18n.js';

let map = null;
const markers = new Map();

/* Custom coral pin marker (default Leaflet icon URLs break under bundling). */
function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<svg width="42" height="54" viewBox="0 0 42 54" aria-hidden="true" focusable="false">
      <path d="M21 1C9.5 1 0 10.4 0 21.9 0 37.8 21 53 21 53s21-15.2 21-31.1C42 10.4 32.5 1 21 1z"
        fill="${color}" stroke="#073434" stroke-width="2.5"/>
      <circle cx="21" cy="21" r="8.5" fill="#FFF8F0"/>
    </svg>`,
    iconSize: [42, 54],
    iconAnchor: [21, 52],
    popupAnchor: [0, -46],
  });
}

export function initMap() {
  const el = document.getElementById('centers-map');
  if (!el || map) return;

  map = L.map(el, {
    scrollWheelZoom: false, // avoid hijacking page scroll; enable on click
    zoomControl: true,
    attributionControl: true,
  }).setView([22.36, 114.13], 10);

  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  }).addTo(map);

  const copy = t('centers.items');
  CENTERS.forEach((c) => {
    const marker = L.marker([c.lat, c.lng], {
      icon: pinIcon(DISTRICTS[c.district].color),
      title: copy[c.id].name,
      alt: copy[c.id].name,
      keyboard: true,
    }).addTo(map);

    const popupHTML = `
      <h3 style="margin:0 0 0.4rem">${copy[c.id].name}</h3>
      <p style="margin:0 0 0.4rem">${copy[c.id].address}</p>
      <p style="margin:0 0 0.6rem"><b>${t('centers.hours')}</b> ${copy[c.id].hours}</p>
      <a href="/schedule.html" class="btn btn--primary btn--sm">${t('centers.viewSchedule')}</a>`;
    marker.bindPopup(popupHTML, { maxWidth: 320 });
    marker.on('click', () => activateCard(c.id));
    markers.set(c.id, marker);
  });

  const card = document.getElementById('center-list')?.querySelector('.center-card');
  if (card) activateCard(card.dataset.center);
}

function activateCard(id) {
  document.querySelectorAll('.center-card').forEach((c) => {
    c.classList.toggle('is-active', c.dataset.center === id);
  });
}

export function renderCenterCards() {
  const host = document.getElementById('center-list');
  const copy = t('centers.items');
  host.innerHTML = CENTERS.map((c) => `
    <article class="center-card" data-center="${c.id}">
      <h3><span class="chip chip--${c.district}" aria-hidden="true"></span> ${copy[c.id].name}</h3>
      <p><b>${t('centers.mtr')}</b>：${copy[c.id].mtr}</p>
      <p>${copy[c.id].address}</p>
      <p><b>${t('centers.hours')}</b>：${copy[c.id].hours}</p>
      <p><b>${t('centers.facilities')}</b>：${copy[c.id].facilities}</p>
      <p><b>☎</b> <a href="tel:+852${copy[c.id].phone.replace(/\s/g, '')}">${copy[c.id].phone}</a></p>
      <div class="btn-group">
        <button type="button" class="btn btn--outline" data-center-go="${c.id}">📍 ${t('centers.showOnMap')}</button>
        <a class="btn btn--secondary" href="/schedule.html" data-i18n="centers.viewSchedule"></a>
      </div>
    </article>`).join('');

  host.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-center-go]');
    if (!btn) return;
    const id = btn.dataset.centerGo;
    const marker = markers.get(id);
    if (marker && map) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13));
      marker.openPopup();
      activateCard(id);
    }
  });

  document.getElementById('centers-map').setAttribute('aria-label', t('centers.mapLabel'));
}

/* ---------- boot ---------- */
renderCenterCards();
initMap();
window.addEventListener('ffe:langchange', () => {
  renderCenterCards();
  markers.forEach((marker, id) => {
    const c = CENTERS.find((x) => x.id === id);
    const copy = t('centers.items');
    marker.setPopupContent(`
      <h3 style="margin:0 0 0.4rem">${copy[c.id].name}</h3>
      <p style="margin:0 0 0.4rem">${copy[c.id].address}</p>
      <p style="margin:0 0 0.6rem"><b>${t('centers.hours')}</b> ${copy[c.id].hours}</p>
      <a href="/schedule.html" class="btn btn--primary btn--sm">${t('centers.viewSchedule')}</a>`);
  });
});
