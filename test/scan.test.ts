import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { scanDistForPages } from '../src/scan.js';

let distDir: string;

before(() => {
  distDir = mkdtempSync(join(tmpdir(), 'sitemap-scan-test-'));

  // Root index
  writeFileSync(join(distDir, 'index.html'), '<html><body>Home</body></html>');

  // Root-level non-index page
  writeFileSync(join(distDir, 'about.html'), '<html><body>About</body></html>');

  // 404 should be excluded
  writeFileSync(join(distDir, '404.html'), '<html><body>Not found</body></html>');

  // Subdirectory with index
  mkdirSync(join(distDir, 'blog'));
  writeFileSync(join(distDir, 'blog', 'index.html'), '<html><body>Blog</body></html>');

  // Subdirectory with non-index page
  writeFileSync(join(distDir, 'blog', 'my-post.html'), '<html><body>Post</body></html>');

  // Nested subdirectory
  mkdirSync(join(distDir, 'aviation'));
  writeFileSync(join(distDir, 'aviation', 'index.html'), '<html><body>Aviation</body></html>');
  writeFileSync(join(distDir, 'aviation', 'faq.html'), '<html><body>FAQ</body></html>');
});

after(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('scanDistForPages', () => {
  it('maps root index.html to /', () => {
    const pages = scanDistForPages(distDir);
    assert.ok(pages.some((p) => p.urlPath === '/'), 'root index.html should map to /');
  });

  it('maps root non-index HTML to /slug', () => {
    const pages = scanDistForPages(distDir);
    assert.ok(pages.some((p) => p.urlPath === '/about'), 'about.html should map to /about');
  });

  it('excludes 404.html', () => {
    const pages = scanDistForPages(distDir);
    assert.ok(!pages.some((p) => p.urlPath.includes('404')), '404.html should be excluded');
  });

  it('maps subdir index.html to /subdir', () => {
    const pages = scanDistForPages(distDir);
    assert.ok(pages.some((p) => p.urlPath === '/blog'), 'blog/index.html should map to /blog');
  });

  it('maps subdir non-index HTML to /subdir/slug', () => {
    const pages = scanDistForPages(distDir);
    assert.ok(pages.some((p) => p.urlPath === '/blog/my-post'), 'blog/my-post.html should map to /blog/my-post');
  });

  it('maps nested subdir pages correctly', () => {
    const pages = scanDistForPages(distDir);
    assert.ok(pages.some((p) => p.urlPath === '/aviation'), 'aviation/index.html should map to /aviation');
    assert.ok(pages.some((p) => p.urlPath === '/aviation/faq'), 'aviation/faq.html should map to /aviation/faq');
  });

  it('returns pages sorted by URL path', () => {
    const pages = scanDistForPages(distDir);
    const paths = pages.map((p) => p.urlPath);
    const sorted = [...paths].sort();
    assert.deepEqual(paths, sorted);
  });

  it('includes htmlPath for each page', () => {
    const pages = scanDistForPages(distDir);
    for (const page of pages) {
      assert.ok(page.htmlPath.endsWith('.html'), `${page.urlPath} should have an htmlPath`);
    }
  });
});
