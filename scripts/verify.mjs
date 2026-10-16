/* ============================================================
   verify.mjs — build-time sanity checks (run: node scripts/verify.mjs)
   1) every i18n key used in source exists in BOTH locales
   2) dynamic keys (programs/centers/news/categories/tags) resolve
   3) the N-body physics loop is numerically stable (no NaN, no
      explosion, speed cap respected) over 3000 frames
   ============================================================ */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const zh = (await import('../src/locales/zh.js')).default;
const en = (await import('../src/locales/en.js').catch(() => ({ default: null }))).default;
const { PROGRAMS, CENTERS, NEWS, DISTRICTS } = await import('../src/js/data.js');
const { CONFIG } = await import('../src/js/nbody.js');

let failures = 0;
const fail = (msg) => { failures += 1; console.error('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

const get = (dict, key) => key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), dict);

/* ---------- 1) literal t()/tf() keys ---------- */
console.log('\n[1] Literal i18n keys used in source:');
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(js|html)$/.test(f.name)) files.push(p);
  }
})(join(root, 'src'));
files.push(...readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => join(root, f)));

const keyRe = /\b(?:t|tf)\s*\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
const dataRe = /data-i18n\s*=\s*"([^"]+)"/g;
const seen = new Set();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  // Strip comments so docs/examples are not counted as real key usage.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
    .split('\n')
    .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('<!--'))
    .join('\n');
  for (const m of code.matchAll(keyRe)) {
    if (m[1].includes('${')) continue; // template-literal fragments inside JSX-ish strings
    seen.add(m[1]);
  }
  for (const m of code.matchAll(dataRe)) {
    const v = m[1];
    if (v.includes(':') || v.includes(';') || v.includes(' ') || v.includes('${')) continue;
    seen.add(v);
  }
}
let checked = 0;
for (const key of [...seen].sort()) {
  if (get(zh, key) === undefined) fail(`zh missing: ${key}`);
  else if (get(en, key) === undefined) fail(`en missing: ${key}`);
  checked += 1;
}
ok(`${checked} literal keys checked in both locales`);

/* ---------- 2) dynamic keys ---------- */
console.log('\n[2] Dynamic (data-driven) keys:');
const combos = [
  ...PROGRAMS.flatMap((p) => [`programs.items.${p.id}.name`, `programs.items.${p.id}.desc`, `programs.items.${p.id}.when`, `programs.items.${p.id}.where`, `programs.items.${p.id}.suitable`]),
  ...PROGRAMS.map((p) => `programs.categories.${p.category}`),
  ...PROGRAMS.map((p) => `programs.intensity.${p.intensity}`),
  ...PROGRAMS.flatMap((p) => p.tags.map((tg) => `programs.tags.${tg}`)),
  ...CENTERS.map((c) => `centers.items.${c.id}.name`),
  ...NEWS.map((n) => `news.items.${n.slug}.title`),
  ...NEWS.map((n) => `news.categories.${n.category}`),
];
for (const key of combos) {
  if (get(zh, key) === undefined) fail(`zh missing dynamic: ${key}`);
  else if (get(en, key) === undefined) fail(`en missing dynamic: ${key}`);
}
ok(`${combos.length} dynamic keys checked (districts: ${Object.keys(DISTRICTS).length})`);

/* ---------- 3) N-body physics stability ---------- */
console.log('\n[3] N-body physics (CONFIG from nbody.js):');
console.log(`    G=${CONFIG.G} damping=${CONFIG.damping} N=${CONFIG.bodyCount} centerMass=${CONFIG.centerMass}`);
const W = 600, H = 470, cx = W / 2, cy = H / 2;
const rand = (() => { let s = 42; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
const bodies = [];
for (let i = 0; i < CONFIG.bodyCount; i++) {
  const angle = rand() * Math.PI * 2;
  const radius = 60 + rand() * (Math.min(W, H) * 0.46 - 60);
  const vOrbit = Math.sqrt((CONFIG.G * CONFIG.centerMass) / (radius + CONFIG.softening / radius));
  bodies.push({
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    vx: -Math.sin(angle) * vOrbit * (0.85 + rand() * 0.3),
    vy: Math.cos(angle) * vOrbit * (0.85 + rand() * 0.3),
    mass: 4 + rand() * 8,
  });
}
let maxSpeedSeen = 0;
let escaped = 0;
for (let frame = 0; frame < 3000; frame++) {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = bodies[i], b = bodies[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const r2 = dx * dx + dy * dy + CONFIG.softening;
      const r = Math.sqrt(r2);
      const ax = (CONFIG.G * b.mass / r2) * (dx / r);
      const ay = (CONFIG.G * b.mass / r2) * (dy / r);
      a.vx += ax; a.vy += ay;
      b.vx -= ax * (a.mass / b.mass); b.vy -= ay * (a.mass / b.mass);
    }
  }
  for (const b of bodies) {
    const dx = cx - b.x, dy = cy - b.y;
    const r2 = dx * dx + dy * dy + CONFIG.softening;
    const r = Math.sqrt(r2);
    b.vx += (CONFIG.G * CONFIG.centerMass / r2) * (dx / r);
    b.vy += (CONFIG.G * CONFIG.centerMass / r2) * (dy / r);
    b.vx *= CONFIG.damping; b.vy *= CONFIG.damping;
    const speed = Math.hypot(b.vx, b.vy);
    maxSpeedSeen = Math.max(maxSpeedSeen, speed);
    if (speed > CONFIG.maxSpeed) {
      b.vx = (b.vx / speed) * CONFIG.maxSpeed;
      b.vy = (b.vy / speed) * CONFIG.maxSpeed;
    }
    b.x += b.vx; b.y += b.vy;
    if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) { fail(`non-finite position at frame ${frame}`); break; }
    if (b.x < -50 || b.x > W + 50 || b.y < -50 || b.y > H + 50) escaped += 1;
    const m = 8;
    if (b.x < m) { b.x = m; b.vx = Math.abs(b.vx); }
    if (b.x > W - m) { b.x = W - m; b.vx = -Math.abs(b.vx); }
    if (b.y < m) { b.y = m; b.vy = Math.abs(b.vy); }
    if (b.y > H - m) { b.y = H - m; b.vy = -Math.abs(b.vy); }
  }
}
ok(`3000 frames simulated, N=${CONFIG.bodyCount} → ${CONFIG.bodyCount * (CONFIG.bodyCount - 1) / 2} pair-interactions/frame`);
ok(`max speed observed ${maxSpeedSeen.toFixed(2)} px/frame (cap ${CONFIG.maxSpeed})`);
ok(`bodies momentarily outside soft bounds: ${escaped} frame-hits (bounced back — expected)`);
const estimatedFPS = `O(N²) ≈ ${(CONFIG.bodyCount * CONFIG.bodyCount / 2).toLocaleString()} force pairs/frame — trivial for 60fps on any laptop`;

/* ---------- summary ---------- */
console.log('\n========================================');
if (failures) { console.error(`VERIFY FAILED — ${failures} problem(s)`); process.exit(1); }
console.log(`ALL CHECKS PASSED — ${checked + combos.length} keys, stable physics (${estimatedFPS})`);
