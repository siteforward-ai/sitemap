import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractIndexableText, calculateChecksum } from '../src/checksum.js';

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Test Page Title</title>
  <meta name="description" content="Test page description">
</head>
<body>
  <img src="logo.png" alt="Company logo">
  <h1>Hello World</h1>
  <script>console.log("ignored");</script>
  <style>.ignored { color: red; }</style>
  <p>Visible body text.</p>
</body>
</html>`;

describe('extractIndexableText', () => {
  it('extracts the title', () => {
    const text = extractIndexableText(SAMPLE_HTML);
    assert.ok(text.includes('Test Page Title'), 'should include title');
  });

  it('extracts meta description', () => {
    const text = extractIndexableText(SAMPLE_HTML);
    assert.ok(text.includes('Test page description'), 'should include meta description');
  });

  it('extracts alt text', () => {
    const text = extractIndexableText(SAMPLE_HTML);
    assert.ok(text.includes('Company logo'), 'should include alt text');
  });

  it('extracts body text', () => {
    const text = extractIndexableText(SAMPLE_HTML);
    assert.ok(text.includes('Hello World'), 'should include heading text');
    assert.ok(text.includes('Visible body text'), 'should include paragraph text');
  });

  it('strips script content', () => {
    const text = extractIndexableText(SAMPLE_HTML);
    assert.ok(!text.includes('console.log'), 'should not include script content');
  });

  it('strips style content', () => {
    const text = extractIndexableText(SAMPLE_HTML);
    assert.ok(!text.includes('.ignored'), 'should not include style content');
  });

  it('returns empty string for blank HTML', () => {
    const text = extractIndexableText('');
    assert.equal(text, '');
  });

  it('handles missing body gracefully', () => {
    const html = '<html><head><title>No body</title></head></html>';
    const text = extractIndexableText(html);
    assert.ok(text.includes('No body'));
  });
});

describe('calculateChecksum', () => {
  it('is deterministic — same input yields same hash', () => {
    const hash1 = calculateChecksum('hello world');
    const hash2 = calculateChecksum('hello world');
    assert.equal(hash1, hash2);
  });

  it('produces different hashes for different content', () => {
    const hash1 = calculateChecksum('hello world');
    const hash2 = calculateChecksum('hello world!');
    assert.notEqual(hash1, hash2);
  });

  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = calculateChecksum('test');
    assert.match(hash, /^[a-f0-9]{64}$/);
  });
});
