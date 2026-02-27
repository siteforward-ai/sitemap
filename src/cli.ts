#!/usr/bin/env node

import { generateSitemap } from './generate.js';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = 'true';
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

const siteUrl = args['site-url'] ?? process.env['SITE_URL'];

if (!siteUrl) {
  console.error('Error: --site-url <url> is required (or set SITE_URL env var)');
  process.exit(1);
}

generateSitemap({
  siteUrl,
  distDir: args['dist'] ?? './dist',
  outputPath: args['output'] ?? './public/sitemap.xml',
  cacheFile: args['cache'] ?? './.sitemap-cache.json',
}).catch((err) => {
  console.error('Error generating sitemap:', err);
  process.exit(1);
});
