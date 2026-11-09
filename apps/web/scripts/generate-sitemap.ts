/**
 * Gera dist/sitemap.xml e dist/robots.txt após o build, a partir de
 * CATEGORIES e do catálogo de @cn/shared. Domínio: VITE_SITE_URL (.env).
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { CATEGORIES, DEMO_PRODUCTS } from '@cn/shared';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv(process.env.NODE_ENV === 'development' ? 'development' : 'production', root, '');
const siteUrl = (env.VITE_SITE_URL || 'http://localhost:4173').replace(/\/$/, '');
if (!env.VITE_SITE_URL) {
  console.warn('[sitemap] VITE_SITE_URL não definido — usando', siteUrl);
}

const today = new Date().toISOString().slice(0, 10);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const entries: { loc: string; priority: string; changefreq: string }[] = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/produtos', priority: '0.9', changefreq: 'weekly' },
  ...CATEGORIES.map((c) => ({ loc: `/produtos?categoria=${c.slug}`, priority: '0.7', changefreq: 'weekly' })),
  ...DEMO_PRODUCTS.map((p) => ({ loc: `/produtos/${p.slug}`, priority: '0.8', changefreq: 'monthly' })),
  { loc: '/servicos', priority: '0.8', changefreq: 'monthly' },
  { loc: '/sobre', priority: '0.6', changefreq: 'monthly' },
  { loc: '/contato', priority: '0.6', changefreq: 'yearly' },
  { loc: '/orcamento', priority: '0.7', changefreq: 'yearly' },
  { loc: '/politica-de-privacidade', priority: '0.2', changefreq: 'yearly' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${esc(siteUrl + e.loc)}</loc><lastmod>${today}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const dist = path.join(root, 'dist');
await writeFile(path.join(dist, 'sitemap.xml'), xml, 'utf8');
await writeFile(path.join(dist, 'robots.txt'), robots, 'utf8');
console.log(`[sitemap] ${entries.length} URLs → dist/sitemap.xml (${siteUrl})`);
