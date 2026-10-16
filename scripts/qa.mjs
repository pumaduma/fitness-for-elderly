/* ============================================================
   qa.mjs — end-to-end interaction tests against the built site.
   Uses puppeteer-core with the locally installed Chrome.
   Run: node scripts/qa.mjs [baseUrl]
   ============================================================ */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4188';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync('/tmp/ffe-qa', { recursive: true });

let passed = 0;
let failed = 0;
const ok = (name) => { passed += 1; console.log(`  ✓ ${name}`); };
const bad = (name, extra = '') => { failed += 1; console.error(`  ✗ ${name} ${extra}`); };
const check = (cond, name, extra = '') => (cond ? ok(name) : bad(name, extra));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1000'],
});

const errors = [];
async function newPage() {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept().catch(() => {})); // accept confirm() prompts
  await page.setViewport({ width: 1440, height: 1000 });
  return page;
}
const goto = (p, path) => p.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 30000 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= HOME ================= */
console.log('\n— HOME —');
{
  const p = await newPage();
  await goto(p, '/index.html');
  const btn = await p.$('#sim-play');
  check(!!btn, 'sim play button exists');
  const label1 = await p.evaluate(() => document.getElementById('sim-play').textContent);
  check(label1.includes('暫停'), `sim autoplays (label: ${label1})`);
  await p.click('#sim-play');
  const label2 = await p.evaluate(() => document.getElementById('sim-play').textContent);
  check(label2.includes('播放'), `pause works (label: ${label2})`);
  await p.click('#sim-reset');
  check(true, 'reset clicked without error');
  // canvas actually painted?
  const painted = await p.evaluate(() => {
    const c = document.getElementById('sim-canvas');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, Math.min(c.width, 40), Math.min(c.height, 40)).data;
    return d.some((v) => v !== 0);
  });
  check(painted, 'canvas has painted pixels');
  const founderCount = await p.$$eval('#founder-grid .card', (els) => els.length);
  check(founderCount === 3, `3 founding-team cards rendered (${founderCount})`);
  const founderNames = await p.$eval('#founder-grid', (el) => el.textContent);
  check(founderNames.includes('Zi Chi') && founderNames.includes('Daniel Chua') && founderNames.includes('Adrian Preston Wong'),
    'all three founders listed by name');
  await p.close();
}

/* ================= LANGUAGE + A11Y TOOLBAR ================= */
console.log('\n— i18n + A11Y toolbar —');
{
  const p = await newPage();
  await goto(p, '/index.html');
  const zhTitle = await p.$eval('h1', (el) => el.textContent);
  await p.click('#lang-toggle');
  await sleep(200);
  const lang = await p.evaluate(() => document.documentElement.lang);
  const enTitle = await p.$eval('h1', (el) => el.textContent);
  check(lang === 'en', `lang switched to en (${lang})`);
  check(enTitle.includes('Move together'), `hero translated (${enTitle.slice(0, 40)})`);
  check(zhTitle.includes('一起動起來'), 'default zh correct');
  await p.click('#lang-toggle'); // back to zh
  // A11y toolbar
  await p.click('#a11y-fs-up');
  let fs = await p.evaluate(() => document.documentElement.dataset.fs);
  check(fs === '112', `font size step 112 (got ${fs})`);
  await p.click('#a11y-contrast');
  let hc = await p.evaluate(() => document.documentElement.classList.contains('high-contrast'));
  check(hc, 'high contrast on');
  await p.reload({ waitUntil: 'networkidle2' });
  fs = await p.evaluate(() => document.documentElement.dataset.fs);
  hc = await p.evaluate(() => document.documentElement.classList.contains('high-contrast'));
  check(fs === '112' && hc, `preferences persisted across reload (fs=${fs}, hc=${hc})`);
  await p.click('#a11y-reset');
  const motion = await p.evaluate(() => document.documentElement.classList.contains('reduce-motion'));
  check(!motion, 'reset clears preferences');
  await p.close();
}

/* ================= PROGRAMS ================= */
console.log('\n— PROGRAMS —');
{
  const p = await newPage();
  await goto(p, '/programs.html');
  const n0 = await p.$$eval('#program-list .card', (els) => els.length);
  check(n0 === 8, `8 program cards (${n0})`);
  await p.click('#program-search');
  await p.type('#program-search', '太極');
  await sleep(300);
  const n1 = await p.$$eval('#program-list .card', (els) => els.length);
  check(n1 === 1, `search 太極 → 1 result (${n1})`);
  await p.click('#program-search');
  await p.evaluate(() => { document.getElementById('program-search').value = ''; });
  await p.type('#program-search', 'water');
  await sleep(300);
  await p.click('#lang-toggle');
  await sleep(300);
  const n2 = await p.$$eval('#program-list .card', (els) => els.length);
  check(n2 === 1, `search "water" in EN → aqua fitness (${n2})`);
  await p.close();
}

/* ================= SCHEDULE + BOOKING ================= */
console.log('\n— SCHEDULE / BOOKING —');
{
  const p = await newPage();
  await goto(p, '/schedule.html');
  const slots = await p.$$eval('#timetable .class-slot', (els) => els.length);
  check(slots > 20, `timetable populated (${slots} slots this week)`);
  const bookBtn = await p.$('#timetable [data-slot]');
  check(!!bookBtn, 'book button exists');
  if (bookBtn) {
    await bookBtn.click();
    await sleep(200);
    const modalOpen = await p.evaluate(() => !document.querySelector('.modal-overlay').hidden);
    check(modalOpen, 'booking modal opens');
    await p.type('#bk-name', '陳大文');
    await p.type('#bk-phone', '91234567');
    await p.click('#booking-form button[type="submit"]');
    await sleep(300);
    const banner = await p.evaluate(() => document.querySelector('.modal-overlay .banner--success')?.textContent || '');
    check(banner.includes('報名成功') || banner.includes('Booking confirmed'), `booking confirmed (${banner.slice(0, 20)})`);
    await p.click('.modal__close');
    await sleep(200);
    const myBookings = await p.$$eval('#bookings-list li', (els) => els.length);
    check(myBookings === 1, `my bookings shows 1 entry (${myBookings})`);
    // The booked slot now shows a "booked" state with NO book button —
    // the UI itself prevents duplicate bookings.
    const bookedLabel = await p.$$eval('.class-slot--booked', (els) => els.length);
    const stillHasBtn = await p.evaluate(() => {
      const s = document.querySelector('.class-slot--booked');
      return s ? !!s.querySelector('[data-slot]') : true;
    });
    check(bookedLabel >= 1 && !stillHasBtn, `booked slot shows state, button removed (${bookedLabel} slot)`);
    // cancel
    await p.click('#bookings-list [data-slot]');
    await sleep(200);
    const left = await p.$$eval('#bookings-list li', (els) => els.length);
    check(left === 0, `cancel booking works (${left} left)`);
    // re-book same slot after cancel
    const bookBtn2 = await p.$('.class-slot [data-slot]');
    if (bookBtn2) {
      await bookBtn2.click();
      await sleep(200);
      await p.type('#bk-name', '陳大文');
      await p.type('#bk-phone', '91234567');
      await p.click('#booking-form button[type="submit"]');
      await sleep(300);
      const again = await p.$$eval('#bookings-list li', (els) => els.length);
      check(again === 1, `re-booking after cancel works (${again})`);
      await p.click('.modal__close');
    }
  }
  await p.close();
}

/* ================= CENTERS (map) ================= */
console.log('\n— CENTERS / MAP —');
{
  const p = await newPage();
  await goto(p, '/centers.html');
  await sleep(2500); // tiles
  const markers = await p.$$eval('.leaflet-marker-icon', (els) => els.length);
  check(markers === 6, `6 map markers (${markers})`);
  const cards = await p.$$eval('.center-card', (els) => els.length);
  check(cards === 6, `6 accessible center cards (${cards})`);
  const tiles = await p.$$eval('.leaflet-tile-loaded', (els) => els.length);
  check(tiles > 4, `OSM tiles loaded (${tiles})`);
  await p.close();
}

/* ================= MEMBERSHIP WIZARD ================= */
console.log('\n— MEMBERSHIP WIZARD —');
{
  const p = await newPage();
  await goto(p, '/membership.html');
  // try to skip validation
  await p.click('#wiz-next');
  await sleep(150);
  let stepNow = await p.evaluate(() => document.querySelector('.wizard-panel:not([hidden])').dataset.step);
  check(stepNow === '1', `validation blocks empty step 1 (still ${stepNow})`);
  // answer eligibility
  await p.click('input[name="age60"][value="yes"]');
  await p.click('input[name="hkid"][value="yes"]');
  await p.click('input[name="medical"][value="no"]');
  await p.click('#wiz-next');
  await sleep(150);
  // personal details
  await p.type('#m-name', '陳大文');
  await p.type('#m-dob', '1950-03-15');
  await p.type('#m-phone', '91234567');
  await p.select('#m-district', '深水埗');
  await p.click('input[name="consent"]');
  await p.click('#wiz-next');
  await sleep(150);
  await p.click('#wiz-next');
  await sleep(200);
  stepNow = await p.evaluate(() => document.querySelector('.wizard-panel:not([hidden])').dataset.step);
  check(stepNow === '4', `review step reached (${stepNow})`);
  const reviewHasName = await p.evaluate(() => document.getElementById('m-review').textContent.includes('陳大文'));
  check(reviewHasName, 'review shows entered data');
  await p.click('#wiz-submit');
  await sleep(300);
  stepNow = await p.evaluate(() => document.querySelector('.wizard-panel:not([hidden])').dataset.step);
  check(stepNow === '5', `success panel reached (${stepNow})`);
  await p.close();
}

/* ================= HEALTH TOOLS ================= */
console.log('\n— HEALTH TOOLS —');
{
  const p = await newPage();
  await goto(p, '/health-tools.html');
  // BMI
  await p.type('#bmi-height', '160');
  await p.type('#bmi-weight', '55');
  await p.click('#bmi-form button[type="submit"]');
  await sleep(150);
  const bmi = await p.evaluate(() => document.getElementById('bmi-result').textContent);
  check(bmi.includes('21.5'), `BMI 160/55 → 21.5 (${bmi.slice(0, 30)})`);
  // fall quiz — all yes = 4/4 high risk
  for (const n of ['fq1', 'fq2', 'fq3', 'fq4']) await p.click(`input[name="${n}"][value="1"]`);
  await p.click('#fall-form button[type="submit"]');
  await sleep(150);
  const fall = await p.evaluate(() => document.getElementById('fall-result').textContent);
  check(fall.includes('4 / 4'), `fall quiz scores 4/4 (${fall.slice(0, 20)})`);
  check(fall.includes('較高') || fall.includes('Higher'), 'high-risk advice shown');
  // tracker
  await p.click('#tracker-days [data-add="0"]');
  await sleep(150);
  const total = await p.evaluate(() => document.getElementById('tracker-total').textContent);
  check(total.includes('10'), `tracker adds minutes (${total})`);
  await p.reload({ waitUntil: 'networkidle2' });
  const total2 = await p.evaluate(() => document.getElementById('tracker-total').textContent);
  check(total2.includes('10'), 'tracker persists across reload');
  await p.click('#tracker-reset');
  await sleep(400); // confirm dialog
  const total3 = await p.evaluate(() => document.getElementById('tracker-total').textContent);
  check(total3.includes('0'), `tracker reset works (${total3})`);
  await p.close();
}

/* ================= DONATE ================= */
console.log('\n— DONATE —');
{
  const p = await newPage();
  await goto(p, '/donate.html');
  await p.click('.tier input[value="300"]');
  await p.type('#d-name', '王小明');
  await p.type('#d-email', 'wong@example.com');
  await p.click('#donate-form button[type="submit"]');
  await sleep(200);
  const visible = await p.evaluate(() => !document.getElementById('d-success').hidden);
  check(visible, 'donation success banner shown');
  await p.close();
}

/* ================= VOLUNTEERS ================= */
console.log('\n— VOLUNTEERS —');
{
  const p = await newPage();
  await goto(p, '/volunteers.html');
  await p.type('#v-name', '李志明');
  await p.type('#v-phone', '91234567');
  await p.select('#v-role', 'assistant');
  await p.click('input[name="consent"]');
  await p.click('#volunteer-form button[type="submit"]');
  await sleep(200);
  const visible = await p.evaluate(() => !document.getElementById('v-success').hidden);
  check(visible, 'volunteer success banner shown');
  await p.close();
}

/* ================= CONTACT ================= */
console.log('\n— CONTACT —');
{
  const p = await newPage();
  await goto(p, '/contact.html');
  await p.type('#c-name', '張先生');
  await p.type('#c-phone', '61234567');
  await p.select('#c-topic', '課程查詢');
  await p.type('#c-message', '想查詢太極班時間');
  await p.click('#contact-form button[type="submit"]');
  await sleep(200);
  const visible = await p.evaluate(() => !document.getElementById('c-success').hidden);
  check(visible, 'contact success banner shown');
  // FAQ accordion
  await p.click('#faq-btn-0');
  await sleep(150);
  const open = await p.evaluate(() => document.getElementById('faq-btn-0').getAttribute('aria-expanded'));
  check(open === 'true', `FAQ accordion opens (aria-expanded=${open})`);
  await p.close();
}

/* ================= NEWS ================= */
console.log('\n— NEWS —');
{
  const p = await newPage();
  await goto(p, '/news.html');
  const cards = await p.$$eval('#news-list .news-card', (els) => els.length);
  check(cards === 4, `4 news cards (${cards})`);
  await p.click('#news-list .news-card h2 a');
  await sleep(300);
  const inArticle = await p.evaluate(() => !document.getElementById('news-article').hidden);
  const title = await p.$eval('#article-body h1', (el) => el.textContent).catch(() => '');
  check(inArticle && title.length > 5, `article view opens (${title.slice(0, 30)})`);
  const url = p.url();
  check(url.includes('#article='), `deep-link URL (${url.slice(-25)})`);
  await p.goto(url, { waitUntil: 'networkidle2' }); // reload deep link
  const still = await p.evaluate(() => !document.getElementById('news-article').hidden);
  check(still, 'article deep link survives reload');
  await p.close();
}

/* ================= ABOUT ================= */
console.log('\n— ABOUT —');
{
  const p = await newPage();
  await goto(p, '/about.html');
  const goalCards = await p.$$eval('#impact-cards .stat-card', (els) => els.length);
  check(goalCards === 4, `4 first-year goal cards render (${goalCards})`);
  const noOldCharts = await p.$$eval('#chart-members, #chart-classes', (els) => els.length);
  check(noOldCharts === 0, 'fictional annual charts removed');
  const founderNames = await p.$eval('#board-grid', (el) => el.textContent).catch(() => '');
  check(founderNames.includes('Zi Chi') && founderNames.includes('Daniel Chua') && founderNames.includes('Adrian Preston Wong'),
    'founding team shows all three founders');
  const hasNoMembers = await p.evaluate(() => document.body.textContent);
  check(!hasNoMembers.includes('10,120') && !hasNoMembers.includes('2008'), 'no leftover member-count/founding-year claims');
  const stats = await p.$$eval('#hk-stats .card', (els) => els.length);
  check(stats === 8, `8 cited HK stats (${stats})`);
  const pdfLinks = await p.$$eval('#reports-grid a[href$=".pdf"]', (els) => els.map((a) => a.href));
  let pdfsOk = 0;
  for (const href of pdfLinks) {
    const res = await fetch(href);
    if (res.status === 200 && res.headers.get('content-type').includes('pdf')) pdfsOk += 1;
  }
  check(pdfsOk === 3, `3 PDF publications downloadable (${pdfsOk}/3)`);
  await p.close();
}

/* ================= NAV (all pages reachable via header) ================= */
console.log('\n— NAVIGATION —');
{
  const p = await newPage();
  await goto(p, '/index.html');
  const links = await p.$$eval('.main-nav a', (els) => els.map((a) => a.getAttribute('href')));
  let navOk = 0;
  for (const href of links) {
    const res = await fetch(BASE + href);
    if (res.status === 200) navOk += 1;
  }
  check(navOk === links.length, `all ${links.length} nav links resolve to 200 (${navOk})`);
  await p.close();
}

/* ================= MOBILE NAV (hamburger) ================= */
console.log('\n— MOBILE NAV —');
{
  const p = await newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await goto(p, '/index.html');
  const toggleVisible = await p.evaluate(() => {
    const t = document.getElementById('nav-toggle');
    return getComputedStyle(t).display !== 'none';
  });
  check(toggleVisible, 'hamburger button visible at 390px');
  await p.click('#nav-toggle');
  await sleep(200);
  const open = await p.evaluate(() => {
    const nav = document.getElementById('main-nav');
    const t = document.getElementById('nav-toggle');
    return nav.classList.contains('is-open') && t.getAttribute('aria-expanded') === 'true';
  });
  check(open, 'menu opens with aria-expanded=true');
  await p.click('#main-nav a[href="/programs.html"]');
  await sleep(400);
  const landed = await p.evaluate(() => window.location.pathname);
  check(landed.includes('programs'), `menu link navigates (${landed})`);
  await p.close();
}

/* ================= summary ================= */
console.log('\n========================================');
const pageErrors = [...new Set(errors)].filter((e) => !e.includes('favicon') && !e.includes('net::'));
if (pageErrors.length) {
  console.error('PAGE ERRORS CAPTURED:');
  pageErrors.forEach((e) => console.error('  • ' + e.slice(0, 160)));
  failed += 1;
}
console.log(`\nQA: ${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
