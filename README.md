# @siteforward/sitemap

Sitemap generator for SSG (Static Site Generation) sites. Scans your pre-rendered `dist/` directory, computes content checksums to preserve `lastmod` dates when pages haven't changed, and outputs a standards-compliant `sitemap.xml`.

## Features

- **Zero external dependencies** — uses only Node.js built-ins (`fs`, `path`, `crypto`)
- **Content-aware caching** — `lastmod` only updates when page content changes
- **Configurable priority rules** — override the default URL→priority mapping
- **CLI + programmatic API** — use as a script or import in build pipelines
- **ESM, TypeScript declarations included**

## Install

```bash
npm install @siteforward/sitemap
```

## Usage

### CLI

```bash
# Basic usage
npx generate-sitemap --site-url https://example.com

# With custom paths
npx generate-sitemap \
  --site-url https://example.com \
  --dist ./dist \
  --output ./public/sitemap.xml \
  --cache ./.sitemap-cache.json

# Via environment variable
SITE_URL=https://example.com npx generate-sitemap
```

### Programmatic API

```ts
import { generateSitemap } from '@siteforward/sitemap';

await generateSitemap({
  siteUrl: 'https://example.com',   // required
  distDir: './dist',                 // default: './dist'
  outputPath: './public/sitemap.xml', // default: './public/sitemap.xml'
  cacheFile: './.sitemap-cache.json', // default: './.sitemap-cache.json'
});
```

### Custom Priority Rules

```ts
import { generateSitemap, defaultPriorityRules } from '@siteforward/sitemap';
import type { PriorityRule } from '@siteforward/sitemap';

const myRules: PriorityRule[] = [
  { match: (p) => p === '/', priority: 1.0, changefreq: 'daily' },
  { match: (p) => p.startsWith('/projects/'), priority: 0.9, changefreq: 'weekly' },
  ...defaultPriorityRules,
];

await generateSitemap({
  siteUrl: 'https://example.com',
  priorityRules: myRules,
});
```

### npm script integration

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "vite build && generate-sitemap --site-url https://example.com",
    "generate-sitemap": "generate-sitemap --site-url https://example.com"
  }
}
```

## Pre-commit Hook

A generic pre-commit hook template is included to regenerate the sitemap automatically when source files change:

```bash
cp node_modules/@siteforward/sitemap/templates/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Edit the hook to uncomment the `git add` line for your output files:

```bash
git add dist/ public/sitemap.xml .sitemap-cache.json
```

## Cache File

The `.sitemap-cache.json` file stores content checksums per URL. Commit this file to your repo so that `lastmod` dates are preserved across CI/CD builds and deployments.

Example:
```json
{
  "/": {
    "checksum": "abc123...",
    "lastmod": "2024-01-15T10:30:00.000Z"
  }
}
```

## Default Priority Rules

| URL pattern | Priority | Change freq |
|-------------|----------|-------------|
| `/` | 1.0 | weekly |
| `/privacy-policy`, `/terms-of-service` | 0.5 | yearly |
| `/about`, `/faq` | 0.9 | monthly |
| `/blog` | 0.7 | weekly |
| `/blog/*` | 0.6 | monthly |
| `*/portfolio` | 0.8 | weekly |
| Depth 1 (e.g. `/services`) | 0.9 | weekly |
| Depth 2+ (e.g. `/services/web`) | 0.8 | monthly |

## API Reference

### `generateSitemap(config: SitemapConfig): Promise<void>`

Main entry point. Scans dist/, reads cache, writes sitemap.xml and updated cache.

### `scanDistForPages(distPath: string): ScannedPage[]`

Returns all HTML pages found in `distPath` as `{ urlPath, htmlPath }` pairs.

### `getPriorityAndChangefreq(urlPath, rules?): { priority, changefreq }`

Evaluates priority rules in order; returns first match or depth-based fallback.

### `extractIndexableText(html: string): string`

Extracts title, meta description, alt text, and body text from HTML.

### `calculateChecksum(text: string): string`

Returns SHA-256 hex digest of the input text.

### `readCache / writeCache / getLastModDate`

Low-level cache utilities for reading/writing `.sitemap-cache.json`.

## Requirements

- Node.js 18+
- A pre-rendered `dist/` directory with `.html` files
