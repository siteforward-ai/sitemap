import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { generateSitemap } from '../src/generate.js';

let tmpDir: string;
let distDir: string;
let publicDir: string;
let outputPath: string;
let cacheFile: string;

function writePage(rel: string, content: string) {
  const full = join(distDir, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
}

before(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'sitemap-generate-test-'));
  distDir = join(tmpDir, 'dist');
  publicDir = join(tmpDir, 'public');
  outputPath = join(publicDir, 'sitemap.xml');
  cacheFile = join(tmpDir, '.sitemap-cache.json');

  mkdirSync(distDir);
  mkdirSync(publicDir);

  writePage('index.html', '<html><head><title>Home</title></head><body><h1>Welcome</h1></body></html>');
  writePage('about.html', '<html><head><title>About</title></head><body><h1>About us</h1></body></html>');
  writePage('blog/index.html', '<html><head><title>Blog</title></head><body><h1>Blog</h1></body></html>');
  writePage('blog/post-one.html', '<html><head><title>Post One</title></head><body><p>Content</p></body></html>');
});

after(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('generateSitemap', () => {
  it('creates sitemap.xml at the specified output path', async () => {
    await generateSitemap({ siteUrl: 'https://example.com', distDir, outputPath, cacheFile });
    assert.ok(existsSync(outputPath), 'sitemap.xml should be created');
  });

  it('sitemap.xml is valid XML with urlset root', async () => {
    const xml = readFileSync(outputPath, 'utf-8');
    assert.ok(xml.startsWith('<?xml'), 'should start with XML declaration');
    assert.ok(xml.includes('<urlset'), 'should contain urlset element');
    assert.ok(xml.includes('</urlset>'), 'should close urlset element');
  });

  it('includes all scanned pages as <loc> entries', async () => {
    const xml = readFileSync(outputPath, 'utf-8');
    assert.ok(xml.includes('<loc>https://example.com/</loc>'), 'should include homepage');
    assert.ok(xml.includes('<loc>https://example.com/about</loc>'), 'should include /about');
    assert.ok(xml.includes('<loc>https://example.com/blog</loc>'), 'should include /blog');
    assert.ok(xml.includes('<loc>https://example.com/blog/post-one</loc>'), 'should include /blog/post-one');
  });

  it('uses the provided siteUrl as the base', async () => {
    const altOutput = join(publicDir, 'sitemap-alt.xml');
    await generateSitemap({ siteUrl: 'https://other-site.com', distDir, outputPath: altOutput, cacheFile });
    const xml = readFileSync(altOutput, 'utf-8');
    assert.ok(xml.includes('https://other-site.com/'), 'should use the provided siteUrl');
    assert.ok(!xml.includes('https://example.com'), 'should not use the old siteUrl');
  });

  it('creates the cache file', async () => {
    assert.ok(existsSync(cacheFile), 'cache file should be created');
    const cache = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    assert.ok('/' in cache, 'cache should have entry for /');
    assert.ok(typeof cache['/'].checksum === 'string');
    assert.ok(typeof cache['/'].lastmod === 'string');
  });

  it('preserves lastmod when content is unchanged on second run', async () => {
    const cache1 = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    const lastmodBefore = cache1['/'].lastmod;

    await generateSitemap({ siteUrl: 'https://example.com', distDir, outputPath, cacheFile });

    const cache2 = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    assert.equal(cache2['/'].lastmod, lastmodBefore, 'lastmod should not change when content is unchanged');
  });

  it('updates lastmod when content changes', async () => {
    const cache1 = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    const lastmodBefore = cache1['/about'].lastmod;

    // Modify content and wait a tick so the timestamp will differ
    await new Promise((r) => setTimeout(r, 10));
    writePage('about.html', '<html><head><title>About Updated</title></head><body><h1>New content</h1></body></html>');

    await generateSitemap({ siteUrl: 'https://example.com', distDir, outputPath, cacheFile });

    const cache2 = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    assert.notEqual(cache2['/about'].lastmod, lastmodBefore, 'lastmod should update when content changes');
  });
});
