export interface SitemapUrl {
  url: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
}

export interface CacheEntry {
  checksum: string;
  lastmod: string;
}

export interface SitemapCache {
  [url: string]: CacheEntry;
}

export interface ScannedPage {
  urlPath: string;
  htmlPath: string;
}

export interface PriorityRule {
  /** Return true if this rule applies to the given URL path */
  match: (urlPath: string) => boolean;
  priority: number;
  changefreq: SitemapUrl['changefreq'];
}

export interface SitemapConfig {
  /** Required: base URL of the site, e.g. 'https://example.com' */
  siteUrl: string;
  /** Path to the pre-rendered dist/ directory. Default: './dist' */
  distDir?: string;
  /** Output path for sitemap.xml. Default: './public/sitemap.xml' */
  outputPath?: string;
  /** Path to the cache JSON file. Default: './.sitemap-cache.json' */
  cacheFile?: string;
  /** Optional priority rules to override the built-in defaults */
  priorityRules?: PriorityRule[];
}
