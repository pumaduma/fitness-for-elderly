/* ============================================================
   Seed data — structured facts only. User-facing copy lives in
   src/locales/{zh,en}.js under matching keys.
   ============================================================ */

export const DISTRICTS = {
  ssp: { name: '深水埗 Sham Shui Po', color: '#d9534f' },
  kt:  { name: '觀塘 Kwun Tong',      color: '#3e8f9e' },
  st:  { name: '沙田 Sha Tin',        color: '#7a5fb8' },
  tm:  { name: '屯門 Tuen Mun',       color: '#d98e2b' },
  ct:  { name: '中環 Central',        color: '#2e7d5b' },
  tko: { name: '將軍澳 Tseung Kwan O', color: '#b04a7a' },
};

/* ---------------- 8 programs ---------------- */
export const PROGRAMS = [
  {
    id: 'fall-prevention',
    category: 'fall',
    intensity: 'moderate',
    icon: '🦯',
    tags: ['balance', 'strength', 'fallProof'],
    duration: 60,
  },
  {
    id: 'tai-chi-24',
    category: 'taichi',
    intensity: 'low',
    icon: '☯️',
    tags: ['balance', 'relaxation', 'fallProof'],
    duration: 60,
  },
  {
    id: 'aqua-fitness',
    category: 'aqua',
    intensity: 'moderate',
    icon: '🏊',
    tags: ['cardio', 'strength', 'pain'],
    duration: 60,
  },
  {
    id: 'chair-strength',
    category: 'strength',
    intensity: 'low',
    icon: '💪',
    tags: ['strength', 'fallProof'],
    duration: 60,
  },
  {
    id: 'stretch-relax',
    category: 'strength',
    intensity: 'low',
    icon: '🧘',
    tags: ['flexibility', 'relaxation', 'pain'],
    duration: 60,
  },
  {
    id: 'walking-club',
    category: 'social',
    intensity: 'moderate',
    icon: '🚶',
    tags: ['cardio', 'social', 'outdoor'],
    duration: 90,
  },
  {
    id: 'cognitive-games',
    category: 'social',
    intensity: 'low',
    icon: '🧩',
    tags: ['cognitive', 'social'],
    duration: 90,
  },
  {
    id: 'social-sing',
    category: 'social',
    intensity: 'low',
    icon: '🎤',
    tags: ['cardio', 'social', 'relaxation'],
    duration: 90,
  },
];

/* ---------------- 6 centers (with real map coordinates) ---------------- */
export const CENTERS = [
  { id: 'ssp', district: 'ssp', lat: 22.3287, lng: 114.1625, programs: ['fall-prevention', 'tai-chi-24', 'aqua-fitness', 'chair-strength', 'stretch-relax', 'walking-club', 'cognitive-games', 'social-sing'] },
  { id: 'kt',  district: 'kt',  lat: 22.3129, lng: 114.2268, programs: ['fall-prevention', 'aqua-fitness', 'chair-strength', 'stretch-relax', 'walking-club', 'social-sing'] },
  { id: 'st',  district: 'st',  lat: 22.3771, lng: 114.1882, programs: ['fall-prevention', 'tai-chi-24', 'chair-strength', 'stretch-relax', 'walking-club', 'cognitive-games', 'social-sing'] },
  { id: 'tm',  district: 'tm',  lat: 22.3767, lng: 113.9637, programs: ['fall-prevention', 'chair-strength', 'stretch-relax', 'walking-club', 'social-sing'] },
  { id: 'ct',  district: 'ct',  lat: 22.2855, lng: 114.1577, programs: ['tai-chi-24', 'chair-strength', 'stretch-relax', 'cognitive-games', 'social-sing'] },
  { id: 'tko', district: 'tko', lat: 22.3220, lng: 114.2580, programs: ['fall-prevention', 'chair-strength', 'stretch-relax', 'walking-club', 'social-sing'] },
];

/* ---------------- Instructors ---------------- */
export const INSTRUCTORS = [
  '陳姑娘 Ms. Chan', '黃sir Mr. Wong', '李姑娘 Ms. Lee', '張sir Mr. Cheung',
  '何姑娘 Ms. Ho', '劉sir Mr. Lau', '吳姑娘 Ms. Ng', '周sir Mr. Chow',
];

/* ---------------- Weekly class schedule (generated) ---------------- */
/* Each program maps to weekdays (0=Sun..6=Sat) + a start hour + capacity. */
export const SCHEDULE_RULES = [
  { program: 'fall-prevention', days: [1, 3], time: '10:00', capacity: 12, instructor: 3 },
  { program: 'tai-chi-24',      days: [2, 4], time: '08:30', capacity: 20, instructor: 1 },
  { program: 'aqua-fitness',    days: [1, 5], time: '14:30', capacity: 15, instructor: 0 },
  { program: 'chair-strength',  days: [2, 6], time: '11:00', capacity: 10, instructor: 4 },
  { program: 'stretch-relax',   days: [3, 6], time: '09:30', capacity: 16, instructor: 6 },
  { program: 'walking-club',    days: [4],    time: '09:00', capacity: 25, instructor: 5 },
  { program: 'cognitive-games', days: [3, 5], time: '14:00', capacity: 14, instructor: 2 },
  { program: 'social-sing',     days: [5],    time: '10:30', capacity: 30, instructor: 7 },
];

/* ---------------- Founding team (for the N-body sim + founder cards) ----------------
   The organisation is brand new and currently has NO members. The three
   founders — all juniors at Hong Kong International School — are the only
   named people in the simulation; every other light is an anonymous
   "future member" we hope to welcome. */
export const FOUNDERS = [
  { id: 'f01', en: 'Zi Chi', roleZh: '聯合創辦人 · 香港國際學校十一年級學生', roleEn: 'Co-founder · Junior, Hong Kong International School' },
  { id: 'f02', en: 'Daniel Chua', roleZh: '聯合創辦人 · 香港國際學校十一年級學生', roleEn: 'Co-founder · Junior, Hong Kong International School' },
  { id: 'f03', en: 'Adrian Preston Wong', roleZh: '聯合創辦人 · 香港國際學校十一年級學生', roleEn: 'Co-founder · Junior, Hong Kong International School' },
];

/* Distinct light-gold colour used for the founders' lights in the sim
   (district colours belong to community members). */
export const FOUNDER_COLOR = '#FFD9A0';

/* ---------------- Donation tiers ---------------- */
export const DONATION_TIERS = [
  { amount: 100, noteKey: 'how.0' },
  { amount: 300, noteKey: 'how.1' },
  { amount: 500, noteKey: 'how.2' },
  { amount: 1000, noteKey: 'how.3' },
];

/* ---------------- First-year goals (we currently have NO members) ----------------
   The organisation is newly founded, so the About page shows honest,
   clearly-labelled year-one goals instead of historical impact figures. */
export const GOALS = {
  firstMembers: 100,   // first-year target: founding members
  classes: 400,        // first-year target: classes held
  volunteers: 30,      // first-year target: volunteers recruited
  fallReduction: 20,   // goal: % reduction in fall risk after the 12-week program
};

/* ---------------- Volunteer roles ---------------- */
export const VOLUNTEER_ROLES = ['assistant', 'befriender', 'event', 'pro'];

/* ---------------- News metadata (bodies live in locales) ---------------- */
export const NEWS = [
  { slug: 'new-tsuen-wan-satellite', category: 'announcement' },
  { slug: 'fall-prevention-study-2025', category: 'research' },
  { slug: 'auntie-fong-swimming-story', category: 'story' },
  { slug: 'swd-voucher-scheme-2025', category: 'announcement' },
];

/* ---------------- Health stats with citations (for About / News) ----------------
   All figures verified against the linked sources (Oct 2026). */
export const HK_STATS = [
  {
    key: 'ageing',
    figureZh: '現時香港每約4.4人便有1人是65歲或以上長者（2024年中：1,718,900人，佔人口22.8%）；預計到2046年，每3名港人中將有超過1人是長者（36.0%）',
    figureEn: 'About one in every 4.4 people in Hong Kong is aged 65+ (mid-2024: 1,718,900 people, 22.8%); by 2046 more than one in three Hong Kong people will be aged 65+ (36.0%)',
    source: '衞生署《2025年香港健康數字一覽》及政府統計處《香港人口推算2022–2046》',
    sourceEn: 'DH “Health Facts of Hong Kong 2025” & C&SD “Hong Kong Population Projections 2022–2046”',
    urls: [
      'https://www.dh.gov.hk/english/statistics/statistics_hs/files/2025.pdf',
      'https://www.info.gov.hk/gia/general/202308/15/P2023081500308.htm',
    ],
  },
  {
    key: 'life',
    figureZh: '香港人均預期壽命屬全球最長之一：男性約82.8歲、女性約88.4歲（2024年臨時數字）',
    figureEn: 'Hong Kong life expectancy is among the world\u2019s longest: about 82.8 years for men and 88.4 for women (2024 provisional)',
    source: '衞生署《2025年香港健康數字一覽》',
    sourceEn: 'DH “Health Facts of Hong Kong 2025”',
    urls: ['https://www.dh.gov.hk/english/statistics/statistics_hs/files/2025.pdf'],
  },
  {
    key: 'falls',
    figureZh: '每年約兩成（每5人中有1人）居於社區的65歲或以上長者會跌倒，跌倒者中約七成半會受傷（包括頭部創傷及骨折）',
    figureEn: 'Each year about 1 in 5 community-dwelling Hong Kong seniors aged 65+ falls, and about 75% of fallers are injured (including head trauma and fractures)',
    source: '衞生署衞生防護中心《非傳染病直擊——長者跌倒》（2013年11月）',
    sourceEn: 'CHP, “Falls in the Elderly”, Non-Communicable Diseases Watch, Nov 2013',
    urls: ['https://www.chp.gov.hk/files/pdf/ncd_watch_nov2013.pdf'],
  },
  {
    key: 'fallsGlobal',
    figureZh: '全球每年估計有68.4萬人因跌倒死亡，跌倒為第二大意外致死原因，60歲以上長者的致命跌倒個案最多',
    figureEn: 'Globally, an estimated 684,000 people die from falls each year — the 2nd leading cause of unintentional injury death; adults over 60 suffer the most fatal falls',
    source: '世界衞生組織《跌倒》專題報導',
    sourceEn: 'WHO “Falls” fact sheet',
    urls: ['https://www.who.int/news-room/fact-sheets/detail/falls'],
  },
  {
    key: 'activity',
    figureZh: '本港運動量不足的長者：65–74歲佔22.2%、75–84歲佔34.3%、85歲或以上佔53.3%（人口健康調查2020–22）',
    figureEn: 'Hong Kong adults not meeting WHO activity levels: 22.2% aged 65–74, 34.3% aged 75–84, 53.3% aged 85+ (Population Health Survey 2020–22)',
    source: '衞生署衞生防護中心《2020–22年度人口健康調查報告（第一部）》',
    sourceEn: 'CHP, “Report of Population Health Survey 2020–22 (Part I)”',
    urls: ['https://www.chp.gov.hk/files/pdf/dh_phs_2020-22_part_1_report_eng_rectified.pdf'],
  },
  {
    key: 'who',
    figureZh: '世衞建議65歲或以上長者：每週150–300分鐘中等強度帶氧運動，另加每週2天或以上肌力訓練，以及每週3天或以上包含平衡訓練的多元運動，以預防跌倒',
    figureEn: 'WHO recommends adults aged 65+: 150–300 min of moderate aerobic activity weekly, plus muscle-strengthening on 2+ days and multicomponent balance-and-strength activity on 3+ days to prevent falls',
    source: '世界衞生組織《體能活動及久坐行為指引》（2020）／衞生署「活出健康新方向」',
    sourceEn: 'WHO “Guidelines on Physical Activity and Sedentary Behaviour” (2020) / DH Change4Health',
    urls: [
      'https://www.change4health.gov.hk/en/physical_activity/guidelines/elders/',
      'https://www.who.int/publications/i/item/9789240015128',
    ],
  },
  {
    key: 'loneliness',
    figureZh: '（註：此為服務使用者調查，非全港隨機抽樣）中大護理學院與救世軍2024年調查顯示，感到中度至嚴重孤獨的60歲以上受訪者由2018年的35.3%升至68.3%，幾乎倍增',
    figureEn: '(Note: survey of service users, not a territory-wide sample) CUHK Nursing & Salvation Army 2024 survey: elderly reporting moderate or severe loneliness rose from 35.3% (2018) to 68.3% (2024) — nearly doubling',
    source: '香港中文大學那打素護理學院 × 救世軍調查（2024）',
    sourceEn: 'CUHK Nethersole School of Nursing × The Salvation Army survey (2024)',
    urls: ['https://www.nur.cuhk.edu.hk/in-the-press/長者孤獨感較5年前升1倍　機構推治療小組助重拾正面心態/'],
  },
  {
    key: 'fallsCost',
    figureZh: '（註：只涵蓋出院後跌倒，官方並無全港總成本數字）中大與港大學者研究（606,392名65歲以上出院病人）發現，單是出院後12個月內的跌倒，每年已耗用本港醫療系統逾2,890萬美元，每次跌倒約75,000港元',
    figureEn: '(Note: covers post-discharge falls only; no official whole-of-HK figure exists) A CUHK–HKU study of 606,392 discharged patients aged 65+ found post-discharge falls alone cost the health system over US$28.9M a year — about HK$75,000 per fall',
    source: '《美國醫護總監協會期刊》JAMDA（2023年10月，中大／港大）',
    sourceEn: 'Journal of the American Medical Directors Association, Oct 2023 (CUHK/HKU)',
    urls: ['https://doi.org/10.1016/j.jamda.2023.07.014'],
  },
];

/* ---------------- HK districts for forms ---------------- */
export const HK_DISTRICTS = [
  '中西區', '灣仔', '東區', '南區', '油尖旺', '深水埗', '九龍城', '黃大仙',
  '觀塘', '葵青', '荃灣', '屯門', '元朗', '北區', '大埔', '沙田', '西貢', '離島',
];
