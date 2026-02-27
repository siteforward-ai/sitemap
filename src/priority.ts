import type { SitemapUrl, PriorityRule } from './types.js';

/**
 * Default priority rules, evaluated in order.
 * Rules:
 *   /                       : 1.0, weekly   (homepage)
 *   /privacy-policy, /tos   : 0.5, yearly   (legal)
 *   /about, /faq            : 0.9, monthly  (informational)
 *   /blog                   : 0.7, weekly   (blog index)
 *   /blog/*                 : 0.6, monthly  (individual posts)
 *   /{section}/portfolio    : 0.8, weekly   (portfolio pages)
 *   depth 1                 : 0.9, weekly   (hub pages)
 *   depth 2+                : 0.8, monthly  (sub-pages)
 */
export const defaultPriorityRules: PriorityRule[] = [
  { match: (p) => p === '/', priority: 1.0, changefreq: 'weekly' },
  { match: (p) => p === '/privacy-policy' || p === '/terms-of-service', priority: 0.5, changefreq: 'yearly' },
  { match: (p) => p === '/about' || p === '/faq', priority: 0.9, changefreq: 'monthly' },
  { match: (p) => p === '/blog', priority: 0.7, changefreq: 'weekly' },
  { match: (p) => p.startsWith('/blog/'), priority: 0.6, changefreq: 'monthly' },
  { match: (p) => p.endsWith('/portfolio'), priority: 0.8, changefreq: 'weekly' },
  { match: (p) => p.split('/').filter(Boolean).length === 1, priority: 0.9, changefreq: 'weekly' },
];

const depthFallback: Pick<SitemapUrl, 'priority' | 'changefreq'> = { priority: 0.8, changefreq: 'monthly' };

/**
 * Assigns priority and changefreq based on URL structure.
 * Evaluates rules in order; first match wins. Falls back to depth-based defaults.
 */
export function getPriorityAndChangefreq(
  urlPath: string,
  rules: PriorityRule[] = defaultPriorityRules
): Pick<SitemapUrl, 'priority' | 'changefreq'> {
  for (const rule of rules) {
    if (rule.match(urlPath)) {
      return { priority: rule.priority, changefreq: rule.changefreq };
    }
  }
  return depthFallback;
}
