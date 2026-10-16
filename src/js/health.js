/* ============================================================
   health.js — three interactive tools:
   1) BMI calculator (elderly-appropriate thresholds)
   2) 4-question fall-risk self-check with scored output
   3) weekly activity tracker (localStorage, 150-min goal)
   ============================================================ */
import { t, tf, getLang, announce } from './i18n.js';

/* ================= 1. BMI ================= */
const bmiForm = document.getElementById('bmi-form');
const bmiResult = document.getElementById('bmi-result');

function bmiCategory(bmi) {
  // Healthy range for older adults is slightly higher than adults (18.5–24.9).
  if (bmi < 18.5) return 'underweight';
  if (bmi < 27) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

bmiForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = document.getElementById('bmi-err');
  const h = parseFloat(bmiForm.querySelector('#bmi-height').value);
  const w = parseFloat(bmiForm.querySelector('#bmi-weight').value);
  err.classList.remove('is-visible');
  if (!(h >= 100 && h <= 250) || !(w >= 20 && w <= 250)) {
    err.classList.add('is-visible');
    bmiResult.hidden = true;
    return;
  }
  const bmi = w / ((h / 100) ** 2);
  const cat = bmiCategory(bmi);
  const cls = cat === 'normal' ? 'ok' : cat === 'underweight' || cat === 'overweight' ? 'warn' : 'alert';
  bmiResult.className = `tool-result tool-result--${cls}`;
  bmiResult.hidden = false;
  bmiResult.innerHTML = `
    <p>${tf('health.bmi.result', { value: bmi.toFixed(1), category: t(`health.bmi.categories.${cat}`) })}</p>
    <p class="mt-1">${t(`health.bmi.advice.${cat}`)}</p>`;
  announce(tf('health.bmi.result', { value: bmi.toFixed(1), category: t(`health.bmi.categories.${cat}`) }));
});

/* ================= 2. Fall-risk quiz ================= */
const fallForm = document.getElementById('fall-form');
const fallResult = document.getElementById('fall-result');

fallForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const vals = ['fq1', 'fq2', 'fq3', 'fq4'].map((n) => fallForm.querySelector(`input[name="${n}"]:checked`));
  if (vals.some((v) => !v)) { announce(t('schedule.booking.fillAll')); return; }
  const score = vals.reduce((sum, v) => sum + Number(v.value), 0);
  const level = score === 0 ? 'low' : score <= 2 ? 'medium' : 'high';
  const cls = level === 'low' ? 'ok' : level === 'medium' ? 'warn' : 'alert';
  fallResult.className = `tool-result tool-result--${cls}`;
  fallResult.hidden = false;
  fallResult.innerHTML = `
    <p style="font-size:1.2rem"><b>${tf('health.fall.score', { n: score })}</b></p>
    <p class="mt-1">${t(`health.fall.levels.${level}`)}</p>
    ${level !== 'low' ? '<a class="btn btn--primary btn--sm mt-1" href="/programs.html#fall-prevention" data-i18n="home.hero.ctaPrograms"></a>' : ''}`;
  announce(tf('health.fall.score', { n: score }));
  document.getElementById('fall-retake').hidden = false;
  fallResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.getElementById('fall-retake').addEventListener('click', () => {
  fallForm.reset();
  fallResult.hidden = true;
  document.getElementById('fall-retake').hidden = true;
  fallForm.querySelector('input').focus();
});

/* ================= 3. Weekly activity tracker ================= */
const LS_KEY = 'ffe-tracker';
const GOAL = 150;

function weekKey() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  return mon.toISOString().slice(0, 10);
}

function loadTracker() {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_KEY));
    if (stored && stored.week === weekKey()) return stored.minutes;
  } catch { /* ignore */ }
  return [0, 0, 0, 0, 0, 0, 0];
}

function saveTracker(minutes) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ week: weekKey(), minutes })); } catch { /* private mode */ }
}

let minutes = loadTracker();

function renderTracker() {
  const host = document.getElementById('tracker-days');
  const days = t('health.tracker.days');
  host.innerHTML = days.map((day, i) => `
    <div class="tracker-day">
      <b>${day}</b>
      <span class="day-count">${minutes[i]}</span>
      <span class="sr-note">${t('common.min')}</span>
      <div class="btn-group" style="justify-content:center">
        <button type="button" class="btn btn--ghost btn--sm" data-sub="${i}" aria-label="−10">−</button>
        <button type="button" class="btn btn--ghost btn--sm" data-add="${i}" aria-label="+10">＋</button>
      </div>
    </div>`).join('');

  const total = minutes.reduce((a, b) => a + b, 0);
  const bar = document.getElementById('tracker-bar');
  bar.value = Math.min(total, GOAL);
  bar.setAttribute('aria-label', `${t('health.tracker.goalProgress')}: ${total}/${GOAL} ${t('common.min')}`);
  document.getElementById('tracker-total').textContent = `${t('health.tracker.total')}：${total} ${t('common.min')}`;
  const status = document.getElementById('tracker-status');
  status.textContent = total >= GOAL
    ? t('health.tracker.goalMet')
    : tf('health.tracker.goalAlmost', { n: GOAL - total });
}

document.getElementById('tracker-days').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  const sub = e.target.closest('[data-sub]');
  if (add) { minutes[Number(add.dataset.add)] += 10; }
  if (sub) { minutes[Number(sub.dataset.sub)] = Math.max(0, minutes[Number(sub.dataset.sub)] - 10); }
  if (add || sub) { saveTracker(minutes); renderTracker(); }
});

document.getElementById('tracker-reset').addEventListener('click', () => {
  if (!window.confirm(t('health.tracker.resetConfirm'))) return;
  minutes = [0, 0, 0, 0, 0, 0, 0];
  saveTracker(minutes);
  renderTracker();
  announce(t('common.reset'));
});

/* ================= boot ================= */
renderTracker();
window.addEventListener('ffe:langchange', renderTracker);
