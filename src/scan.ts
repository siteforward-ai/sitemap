import { readdirSync } from 'fs';
import { join } from 'path';
import type { ScannedPage } from './types.js';

/**
 * Walks the dist/ directory and returns all pre-rendered pages as { urlPath, htmlPath } pairs.
 * index.html files map to their parent directory URL; other .html files map directly.
 * 404.html is excluded as it is not a real page.
 */
export function scanDistForPages(distPath: string): ScannedPage[] {
  const pages: ScannedPage[] = [];

  function walk(dir: string, basePath: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), `${basePath}/${entry.name}`);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const htmlPath = join(dir, entry.name);
        if (entry.name === 'index.html') {
          pages.push({ urlPath: basePath === '' ? '/' : basePath, htmlPath });
        } else {
          const slug = entry.name.slice(0, -5);
          if (slug !== '404') {
            pages.push({ urlPath: `${basePath}/${slug}`, htmlPath });
          }
        }
      }
    }
  }

  walk(distPath, '');
  return pages.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
}
