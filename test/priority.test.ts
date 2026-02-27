import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPriorityAndChangefreq, defaultPriorityRules } from '../src/priority.js';
import type { PriorityRule } from '../src/types.js';

describe('getPriorityAndChangefreq', () => {
  it('homepage gets 1.0 weekly', () => {
    const result = getPriorityAndChangefreq('/');
    assert.equal(result.priority, 1.0);
    assert.equal(result.changefreq, 'weekly');
  });

  it('privacy-policy gets 0.5 yearly', () => {
    const result = getPriorityAndChangefreq('/privacy-policy');
    assert.equal(result.priority, 0.5);
    assert.equal(result.changefreq, 'yearly');
  });

  it('terms-of-service gets 0.5 yearly', () => {
    const result = getPriorityAndChangefreq('/terms-of-service');
    assert.equal(result.priority, 0.5);
    assert.equal(result.changefreq, 'yearly');
  });

  it('/about gets 0.9 monthly', () => {
    const result = getPriorityAndChangefreq('/about');
    assert.equal(result.priority, 0.9);
    assert.equal(result.changefreq, 'monthly');
  });

  it('/faq gets 0.9 monthly', () => {
    const result = getPriorityAndChangefreq('/faq');
    assert.equal(result.priority, 0.9);
    assert.equal(result.changefreq, 'monthly');
  });

  it('/blog index gets 0.7 weekly', () => {
    const result = getPriorityAndChangefreq('/blog');
    assert.equal(result.priority, 0.7);
    assert.equal(result.changefreq, 'weekly');
  });

  it('/blog/post gets 0.6 monthly', () => {
    const result = getPriorityAndChangefreq('/blog/my-post');
    assert.equal(result.priority, 0.6);
    assert.equal(result.changefreq, 'monthly');
  });

  it('/section/portfolio gets 0.8 weekly', () => {
    const result = getPriorityAndChangefreq('/aviation/portfolio');
    assert.equal(result.priority, 0.8);
    assert.equal(result.changefreq, 'weekly');
  });

  it('depth-1 page gets 0.9 weekly', () => {
    const result = getPriorityAndChangefreq('/aviation');
    assert.equal(result.priority, 0.9);
    assert.equal(result.changefreq, 'weekly');
  });

  it('depth-2 page falls back to 0.8 monthly', () => {
    const result = getPriorityAndChangefreq('/aviation/faq');
    assert.equal(result.priority, 0.8);
    assert.equal(result.changefreq, 'monthly');
  });

  it('depth-3 page falls back to 0.8 monthly', () => {
    const result = getPriorityAndChangefreq('/section/sub/page');
    assert.equal(result.priority, 0.8);
    assert.equal(result.changefreq, 'monthly');
  });

  it('custom rules override defaults — first match wins', () => {
    const customRules: PriorityRule[] = [
      { match: (p) => p.startsWith('/projects/'), priority: 0.95, changefreq: 'daily' },
      ...defaultPriorityRules,
    ];
    const result = getPriorityAndChangefreq('/projects/my-project', customRules);
    assert.equal(result.priority, 0.95);
    assert.equal(result.changefreq, 'daily');
  });

  it('custom rules still fall through to defaults', () => {
    const customRules: PriorityRule[] = [
      { match: (p) => p.startsWith('/projects/'), priority: 0.95, changefreq: 'daily' },
      ...defaultPriorityRules,
    ];
    const result = getPriorityAndChangefreq('/', customRules);
    assert.equal(result.priority, 1.0);
    assert.equal(result.changefreq, 'weekly');
  });
});
