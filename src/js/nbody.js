/* ============================================================
   nbody.js — Canvas 2D N-body gravity simulation.
   ============================================================
   Concept: each body is a community member, colour-coded by
   district. A huge "Community Center" attractor sits in the
   middle and pulls everyone into orbit, while members also
   attract each other — a living picture of how seniors,
   classes and centers form one connected wellness ecosystem.

   HOW THE PHYSICS WORKS (junior-dev friendly):
   ------------------------------------------------------------
   1. Newton's law of gravitation says two masses attract with
      force  F = G * m1 * m2 / r²  along the line joining them.
   2. We apply that force to each body every frame (O(N²) pair
      loop — totally fine for N ≤ 120).
   3. Because we only need *pixels of acceleration* per frame,
      we fold everything into one constant G and skip real units.
   4. "Softening" adds a small constant to r² so two bodies that
      get extremely close do not receive infinite acceleration.
   5. Each frame: compute acceleration → add to velocity → add
      velocity to position → apply damping → draw.
   6. Bodies are seeded with tangential (sideways) velocity so
      they orbit the center instead of falling straight in —
      the same trick real satellites use.

   TUNING: change the CONFIG object below. Higher G = stronger
   attraction. Lower damping = livelier but messier system.
   trailLength controls the glowing tails. centerMass controls
   how tightly members cluster around the center.
   ============================================================ */
import { FOUNDERS, FOUNDER_COLOR, DISTRICTS } from './data.js';
import { t, tf, getLang } from './i18n.js';
import { createModal } from './modal.js';

export const CONFIG = {
  G: 0.048,          // gravitational constant (px³ per mass per frame²)
  damping: 0.9992,   // velocity damping per frame (1 = no loss)
  bodyCount: 80,     // total bodies: 3 founders + 77 future members
  trailLength: 12,   // trail points remembered per body
  centerMass: 2600,  // mass of the Community Center attractor
  softening: 900,    // distance² softening — prevents singularities (² units)
  maxSpeed: 4.5,     // speed cap so the system never explodes
  centerRadius: 26,  // radius of the drawn center core (px)
};

/* ---------------- helper: seeded pseudo-random ----------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- body factory ----------------- */
function makeBodies(count, width, height, rand) {
  const bodies = [];
  const cx = width / 2;
  const cy = height / 2;
  const minR = 60;                       // keep clear of the center core
  const maxR = Math.min(width, height) * 0.46;

  for (let i = 0; i < count; i++) {
    // The first few bodies are the three named founders (pale-gold stars);
    // everyone else is an anonymous "future member" — the community we
    // hope to welcome (we currently have no members yet).
    const founder = i < FOUNDERS.length ? FOUNDERS[i] : null;
    const district = Object.keys(DISTRICTS)[Math.floor(rand() * Object.keys(DISTRICTS).length)];

    // Seed position: a random ring around the center.
    const angle = rand() * Math.PI * 2;
    const radius = minR + rand() * (maxR - minR);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    // Seed tangential velocity ≈ circular-orbit speed v = sqrt(G*M/r).
    // We estimate the central force only (mutual forces are a gentle
    // perturbation), which keeps the whole cloud orbiting instead of
    // collapsing onto the center.
    const vOrbit = Math.sqrt((CONFIG.G * CONFIG.centerMass) / (radius + CONFIG.softening / radius));
    const jitter = 0.85 + rand() * 0.3;
    const vx = -Math.sin(angle) * vOrbit * jitter;
    const vy = Math.cos(angle) * vOrbit * jitter;

    bodies.push({
      x, y, vx, vy,
      mass: founder ? 10 + rand() * 6 : 4 + rand() * 4,  // founders anchor the system
      radius: founder ? 5 : 2.8,
      color: founder ? FOUNDER_COLOR : DISTRICTS[district].color,
      founder,
      trail: [],        // ring buffer of recent positions
    });
  }
  return bodies;
}

/* ---------------- the simulation engine ----------------- */
export function initSimulation(stage) {
  // The canvas lives inside .sim-stage; controls/tooltip/legend are
  // siblings inside .sim-wrap, so scope lookups to the wrapper.
  const wrap = stage.closest('.sim-wrap') || stage;
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const tooltip = wrap.querySelector('.sim-tooltip');
  const btnPlay = wrap.querySelector('#sim-play');
  const btnReset = wrap.querySelector('#sim-reset');
  const note = wrap.querySelector('.sim-note');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let bodies = [];
  let rafId = null;
  let playing = false;
  let wasPlayingBeforeMotionOff = false;
  let hovered = null;
  const rand = mulberry32(20260801);

  /* ---------- sizing (retina-aware) ---------- */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = stage.clientWidth;
    height = Math.round(Math.min(Math.max(width * 0.78, 300), 460));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!bodies.length) reset();
  }

  /* ---------- reset: re-seed everything ---------- */
  function reset() {
    bodies = makeBodies(CONFIG.bodyCount, width, height, rand);
    bodies.forEach((b) => { b.trail = []; });
    drawStatic(); // paint immediately so the stage is never empty
  }

  /* ---------- one physics step for every pair (O(N²)) ---------- */
  function step() {
    const cx = width / 2;
    const cy = height / 2;
    const n = bodies.length;

    // 1) Mutual attraction: for every pair i<j, pull both together.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = bodies[i];
        const b = bodies[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let r2 = dx * dx + dy * dy + CONFIG.softening;  // softened distance²
        const r = Math.sqrt(r2);
        // acceleration magnitude = G * m2 / r² ; direction = unit vector
        const ax = (CONFIG.G * b.mass / r2) * (dx / r);
        const ay = (CONFIG.G * b.mass / r2) * (dy / r);
        a.vx += ax; a.vy += ay;
        b.vx -= ax * (a.mass / b.mass);  // Newton's 3rd law: equal & opposite
        b.vy -= ay * (a.mass / b.mass);
      }
    }

    // 2) Central attractor: the Community Center pulls everyone in.
    for (const b of bodies) {
      const dx = cx - b.x;
      const dy = cy - b.y;
      const r2 = dx * dx + dy * dy + CONFIG.softening;
      const r = Math.sqrt(r2);
      b.vx += (CONFIG.G * CONFIG.centerMass / r2) * (dx / r);
      b.vy += (CONFIG.G * CONFIG.centerMass / r2) * (dy / r);

      // 3) Integrate: velocity → position, with damping + speed cap.
      b.vx *= CONFIG.damping;
      b.vy *= CONFIG.damping;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > CONFIG.maxSpeed) {
        b.vx = (b.vx / speed) * CONFIG.maxSpeed;
        b.vy = (b.vy / speed) * CONFIG.maxSpeed;
      }
      b.x += b.vx;
      b.y += b.vy;

      // 4) Gentle bounce at the walls so nobody escapes forever.
      const m = 8;
      if (b.x < m) { b.x = m; b.vx = Math.abs(b.vx); }
      if (b.x > width - m) { b.x = width - m; b.vx = -Math.abs(b.vx); }
      if (b.y < m) { b.y = m; b.vy = Math.abs(b.vy); }
      if (b.y > height - m) { b.y = height - m; b.vy = -Math.abs(b.vy); }

      // 5) Remember this position for the trail (ring buffer).
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > CONFIG.trailLength) b.trail.shift();
    }
  }

  /* ---------- drawing ---------- */
  function drawBackground() {
    ctx.fillStyle = '#06201f';
    ctx.fillRect(0, 0, width, height);
  }

  function drawCenter() {
    const cx = width / 2;
    const cy = height / 2;
    // soft glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.centerRadius * 3.4);
    glow.addColorStop(0, 'rgba(242,169,59,0.9)');
    glow.addColorStop(0.4, 'rgba(232,97,60,0.45)');
    glow.addColorStop(1, 'rgba(232,97,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, CONFIG.centerRadius * 3.4, 0, Math.PI * 2);
    ctx.fill();
    // core
    ctx.fillStyle = '#F2A93B';
    ctx.beginPath();
    ctx.arc(cx, cy, CONFIG.centerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, CONFIG.centerRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodies() {
    for (const b of bodies) {
      // trail: fading polyline
      if (b.trail.length > 1) {
        ctx.lineWidth = 1.4;
        for (let i = 1; i < b.trail.length; i++) {
          const alpha = (i / b.trail.length) * 0.4;
          ctx.strokeStyle = `${b.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y);
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
          ctx.stroke();
        }
      }
      // body
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      if (b === hovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawStatic() {
    // Reduced-motion fallback: a calm, non-animated constellation.
    drawBackground();
    ctx.strokeStyle = 'rgba(255,248,240,0.22)';
    ctx.lineWidth = 1;
    for (const b of bodies) {
      // connect each body to its nearest 1-2 neighbours — constellation lines
      const nearest = [...bodies]
        .filter((o) => o !== b)
        .sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))
        .slice(0, 2);
      for (const o of nearest) {
        if (o.x > b.x) { // draw each line once
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(o.x, o.y);
          ctx.stroke();
        }
      }
    }
    for (const b of bodies) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    drawCenter();
  }

  function draw() {
    drawBackground();
    drawBodies();
    drawCenter();
  }

  /* ---------- animation loop ---------- */
  function loop() {
    if (!playing) return;
    step();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function play() {
    if (playing) return;
    playing = true;
    btnPlay.textContent = t('sim.pause');
    btnPlay.setAttribute('aria-pressed', 'true');
    loop();
  }

  function pause() {
    playing = false;
    if (rafId) cancelAnimationFrame(rafId);
    btnPlay.textContent = t('sim.play');
    btnPlay.setAttribute('aria-pressed', 'false');
  }

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion');

  /* ---------- pointer interaction: hover tooltip + click story ---------- */
  function bodyAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = null;
    let bestD = 14; // pick-up radius in px
    for (const b of bodies) {
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  function showTooltip(b, clientX, clientY) {
    if (!b) { tooltip.hidden = true; hovered = null; return; }
    hovered = b;
    if (b.founder) {
      tooltip.innerHTML = `<b>${b.founder.en}</b>${t('sim.founder')}`;
    } else {
      tooltip.innerHTML = `<b>${t('sim.futureMember')}</b>`;
    }
    tooltip.hidden = false;
    // keep tooltip inside the stage
    const rect = stage.getBoundingClientRect();
    const tx = Math.min(Math.max(clientX - rect.left + 14, 4), rect.width - 170);
    const ty = Math.min(Math.max(clientY - rect.top - 12, 4), rect.height - 70);
    tooltip.style.left = `${tx}px`;
    tooltip.style.top = `${ty}px`;
  }

  /* ---------- founder profile / join modal ---------- */
  const storyModal = createModal();
  const openStory = (b) => {
    if (!b) return;
    if (!b.founder) {
      // Anonymous "future member" light — invite the visitor to be first.
      storyModal.open({
        title: t('sim.joinCta'),
        contentHTML: `
          <p>${t('home.hero.simHint')}</p>
          <div class="btn-group mt-1"><a class="btn btn--primary" href="/membership.html">${t('sim.joinBtn')}</a></div>`,
      });
      return;
    }
    const lang = getLang();
    const role = lang === 'zh' ? b.founder.roleZh : b.founder.roleEn;
    storyModal.open({
      title: tf('sim.storyOf', { name: b.founder.en }),
      contentHTML: `
        <p class="pill-row">
          <span class="badge">${t('sim.founder')}</span>
          <span class="badge badge--gold">${role}</span>
        </p>
        <p>${tf('sim.founderBody', { name: b.founder.en })}</p>
        <div class="btn-group mt-1">
          <a class="btn btn--secondary" href="/about.html">${t('nav.about')}</a>
          <a class="btn btn--primary" href="/membership.html">${t('sim.joinBtn')}</a>
        </div>`,
    });
  };

  /* ---------- wiring ---------- */
  btnPlay.addEventListener('click', () => (playing ? pause() : play()));
  btnReset.addEventListener('click', () => { reset(); if (!playing && !prefersReducedMotion()) draw(); });

  canvas.addEventListener('mousemove', (e) => {
    if (!playing && prefersReducedMotion()) return;
    const b = bodyAt(e.clientX, e.clientY);
    canvas.style.cursor = b ? 'pointer' : 'default';
    showTooltip(b, e.clientX, e.clientY);
  });
  canvas.addEventListener('mouseleave', () => { showTooltip(null); });
  canvas.addEventListener('click', (e) => {
    const b = bodyAt(e.clientX, e.clientY);
    if (b) openStory(b);
  });

  // Keyboard access: focus the canvas and press Enter/Space to meet a founder.
  canvas.setAttribute('tabindex', '0');
  canvas.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const founders = bodies.filter((b) => b.founder);
    const pick = founders[Math.floor(Math.random() * founders.length)] || bodies[0];
    openStory(pick);
  });

  // Respect the a11y toolbar's reduce-motion toggle live.
  window.addEventListener('ffe:a11ychange', (e) => {
    const motion = e.detail && e.detail.motion;
    if (motion) {
      wasPlayingBeforeMotionOff = playing;
      pause();
      drawStatic();
      if (note) note.hidden = false;
    } else {
      if (note) note.hidden = true;
      draw();
      if (wasPlayingBeforeMotionOff) play();
    }
  });

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener?.('change', (e) => {
    if (e.matches) { wasPlayingBeforeMotionOff = playing; pause(); drawStatic(); }
    else { draw(); if (wasPlayingBeforeMotionOff) play(); }
  });

  // Keep the play/pause button label in the current language.
  window.addEventListener('ffe:langchange', () => {
    btnPlay.textContent = playing ? t('sim.pause') : t('sim.play');
  });

  window.addEventListener('resize', () => { resize(); if (!playing) draw(); });

  /* ---------- init ---------- */
  resize();
  btnPlay.textContent = t('sim.play');
  btnPlay.setAttribute('aria-pressed', 'false');
  if (prefersReducedMotion()) {
    if (note) note.hidden = false;
    drawStatic();
  } else {
    if (note) note.hidden = true;
    play(); // autoplay the ecosystem
  }

  return { play, pause, reset, bodies: () => bodies };
}
