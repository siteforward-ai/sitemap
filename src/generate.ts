import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { SitemapUrl, SitemapCache, SitemapConfig } from './types.js';
import { scanDistForPages } from './scan.js';
import { getPriorityAndChangefreq } from './priority.js';
import { extractIndexableText, calculateChecksum } from './checksum.js';
import { readCache, writeCache, getLastModDate } from './cache.js';

/**
 * Generates a sitemap.xml by scanning the pre-rendered dist/ directory.
 * Every HTML file becomes a sitemap entry — no manual route enumeration needed.
 */
export async function generateSitemap(config: SitemapConfig): Promise<void> {
  const {
    siteUrl,
    distDir = './dist',
    outputPath = './public/sitemap.xml',
    cacheFile = './.sitemap-cache.json',
    priorityRules,
  } = config;

  const distPath = resolve(distDir);
  const cachePath = resolve(cacheFile);
  const resolvedOutput = resolve(outputPath);

  const oldCache = readCache(cachePath);
  const newCache: SitemapCache = {};

  const pages = scanDistForPages(distPath);
  const sitemapUrls: SitemapUrl[] = [];

  for (const { urlPath, htmlPath } of pages) {
    const { priority, changefreq } = getPriorityAndChangefreq(urlPath, priorityRules);

    let lastmod: string;
    try {
      const html = readFileSync(htmlPath, 'utf-8');
      const text = extractIndexableText(html);
      const checksum = calculateChecksum(text);
      lastmod = getLastModDate(urlPath, checksum, oldCache);
      newCache[urlPath] = { checksum, lastmod };
    } catch {
      console.warn(`Warning: Failed to process ${htmlPath}, using current date`);
      lastmod = new Date().toISOString();
      newCache[urlPath] = { checksum: '', lastmod };
    }

    sitemapUrls.push({ url: urlPath, changefreq, priority, lastmod });
  }

  const urlEntries = sitemapUrls.map(({ url, changefreq, priority, lastmod }) =>
    [
      '  <url>',
      `    <loc>${siteUrl}${url}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority.toFixed(1)}</priority>`,
      '  </url>'
    ].join('\n')
  ).join('\n');

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urlEntries + '\n' +
    '</urlset>\n';

  writeFileSync(resolvedOutput, xml);
  writeCache(cachePath, newCache);

  const updatedCount = sitemapUrls.filter(({ url, lastmod }) => {
    const cached = oldCache[url];
    return !cached || cached.lastmod !== lastmod;
  }).length;

  console.log(`Sitemap generated: ${sitemapUrls.length} URLs → ${resolvedOutput}`);
  console.log(`Updated: ${updatedCount}, Unchanged: ${sitemapUrls.length - updatedCount}`);
  console.log(`Cache: ${cachePath}`);
}
