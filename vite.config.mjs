import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

// Multi-page app: one real .html route per page, each with its own URL.
const pages = {
  index: resolve(__dirname, 'index.html'),
  programs: resolve(__dirname, 'programs.html'),
  schedule: resolve(__dirname, 'schedule.html'),
  centers: resolve(__dirname, 'centers.html'),
  membership: resolve(__dirname, 'membership.html'),
  volunteers: resolve(__dirname, 'volunteers.html'),
  donate: resolve(__dirname, 'donate.html'),
  'health-tools': resolve(__dirname, 'health-tools.html'),
  about: resolve(__dirname, 'about.html'),
  contact: resolve(__dirname, 'contact.html'),
  news: resolve(__dirname, 'news.html'),
};

/* Routes for the sitemap, derived from the pages above.
   index.html is served at "/" so it maps to the site root. */
const ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/programs.html', changefreq: 'weekly', priority: '0.9' },
  { path: '/schedule.html', changefreq: 'weekly', priority: '0.9' },
  { path: '/membership.html', changefreq: 'monthly', priority: '0.9' },
  { path: '/centers.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/volunteers.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/donate.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/news.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/health-tools.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/about.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact.html', changefreq: 'monthly', priority: '0.7' },
];

/* ------------------------------------------------------------------
   SEO plugin — makes the built site "Google-ready" for whatever URL
   it is deployed to. Set SITE_URL at build time:

     SITE_URL=https://ffe-hk.netlify.app npm run build

   It then injects, on every page:
     - <link rel="canonical">   (tells Google the one true URL)
     - og:url + absolute og:image (needed for link previews)
   and writes dist/sitemap.xml + dist/robots.txt for that domain.
   Without SITE_URL the build still works (no canonical/sitemap,
   with a reminder printed).
   ------------------------------------------------------------------ */
function seoPlugin(siteUrl) {
  return {
    name: 'ffe-seo',
    apply: 'build',

    transformIndexHtml(html, ctx) {
      const route = ctx.path === '/index.html' ? '/' : ctx.path;
      const canonical = siteUrl ? `${siteUrl}${route}` : '';
      const tags = [
        // Share image always uses an absolute URL when we know the domain,
        // so WhatsApp / Slack / Facebook previews render reliably.
        { tag: 'meta', attrs: { property: 'og:image', content: `${siteUrl || ''}/og-image.svg` }, injectTo: 'head' },
      ];
      if (canonical) {
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: canonical }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:url', content: canonical }, injectTo: 'head' },
        );
      }
      // Optional: paste the token from Google Search Console to verify
      // ownership without editing the deployed files by hand.
      const gsc = (process.env.GOOGLE_SITE_VERIFICATION || '').trim();
      if (gsc) {
        tags.push({ tag: 'meta', attrs: { name: 'google-site-verification', content: gsc }, injectTo: 'head' });
      }
      return { html, tags };
    },

    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      mkdirSync(outDir, { recursive: true });

      // robots.txt is always written.
      const robots = siteUrl
        ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
        : 'User-agent: *\nAllow: /\n';
      writeFileSync(resolve(outDir, 'robots.txt'), robots);

      if (!siteUrl) {
        console.warn('\n⚠  SITE_URL was not set — no sitemap.xml generated and pages have no canonical URL.');
        console.warn('   Build for Google with:  SITE_URL=https://your-site-url npm run build\n');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const urls = ROUTES.map((r) => [
        '  <url>',
        `    <loc>${siteUrl}${r.path}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${r.changefreq}</changefreq>`,
        `    <priority>${r.priority}</priority>`,
        '  </url>',
      ].join('\n')).join('\n');
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap);
      console.log(`\n✓ SEO files generated for ${siteUrl} (sitemap.xml with ${ROUTES.length} URLs + robots.txt)`);
    },
  };
}

export default defineConfig(() => {
  const SITE_URL = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  return {
    plugins: [seoPlugin(SITE_URL)],
    build: {
      rollupOptions: {
        input: pages,
      },
      target: 'es2018',
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
