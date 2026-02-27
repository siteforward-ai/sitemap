import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { readCache, writeCache, getLastModDate } from '../src/cache.js';
import type { SitemapCache } from '../src/types.js';

let tmpDir: string;

before(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'sitemap-cache-test-'));
});

after(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('readCache', () => {
  it('returns empty object when file does not exist', () => {
    const result = readCache(join(tmpDir, 'nonexistent.json'));
    assert.deepEqual(result, {});
  });

  it('returns empty object when file contains invalid JSON', () => {
    const badPath = join(tmpDir, 'bad.json');
    writeFileSync(badPath, 'not json');
    const result = readCache(badPath);
    assert.deepEqual(result, {});
  });
});

describe('writeCache + readCache round-trip', () => {
  it('writes and reads back cache data correctly', () => {
    const cachePath = join(tmpDir, 'cache.json');
    const cache: SitemapCache = {
      '/': { checksum: 'abc123', lastmod: '2024-01-01T00:00:00.000Z' },
      '/about': { checksum: 'def456', lastmod: '2024-01-02T00:00:00.000Z' },
    };
    writeCache(cachePath, cache);
    assert.ok(existsSync(cachePath), 'cache file should exist');
    const result = readCache(cachePath);
    assert.deepEqual(result, cache);
  });
});

describe('getLastModDate', () => {
  const cache: SitemapCache = {
    '/': { checksum: 'matching-checksum', lastmod: '2024-01-01T00:00:00.000Z' },
  };

  it('returns cached lastmod when checksum matches', () => {
    const result = getLastModDate('/', 'matching-checksum', cache);
    assert.equal(result, '2024-01-01T00:00:00.000Z');
  });

  it('returns a new date when checksum does not match', () => {
    const before = Date.now();
    const result = getLastModDate('/', 'different-checksum', cache);
    const after = Date.now();
    const resultTime = new Date(result).getTime();
    assert.ok(resultTime >= before && resultTime <= after, 'should return a current timestamp');
  });

  it('returns a new date for an unknown URL', () => {
    const before = Date.now();
    const result = getLastModDate('/new-page', 'any-checksum', cache);
    const after = Date.now();
    const resultTime = new Date(result).getTime();
    assert.ok(resultTime >= before && resultTime <= after, 'should return a current timestamp');
  });
});
