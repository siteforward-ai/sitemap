import { writeFileSync, readFileSync, existsSync } from 'fs';
import type { SitemapCache } from './types.js';

export function readCache(cachePath: string): SitemapCache {
  if (!existsSync(cachePath)) return {};
  try {
    return JSON.parse(readFileSync(cachePath, 'utf-8'));
  } catch (error) {
    console.warn('Warning: Failed to read cache file, starting fresh:', error);
    return {};
  }
}

export function writeCache(cachePath: string, cache: SitemapCache): void {
  try {
    writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error: Failed to write cache file:', error);
  }
}

export function getLastModDate(url: string, checksum: string, cache: SitemapCache): string {
  const cached = cache[url];
  if (cached && cached.checksum === checksum) return cached.lastmod;
  return new Date().toISOString();
}
