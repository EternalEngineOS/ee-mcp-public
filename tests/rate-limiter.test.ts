import { describe, it, expect } from 'vitest';
import { RateLimiter, RateLimitExceededError } from '../src/rate-limiter.js';

describe('RateLimiter', () => {
  it('allows calls under the limit', () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 5; i++) {
      expect(() => limiter.check('toolA', { limit: 5, window: '1m' })).not.toThrow();
    }
  });

  it('throws RateLimitExceededError on the call that exceeds the limit', () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 3; i++) limiter.check('toolB', { limit: 3, window: '1m' });
    expect(() => limiter.check('toolB', { limit: 3, window: '1m' })).toThrow(RateLimitExceededError);
  });

  it('does not enforce a limit when none is configured (public/no-auth tools)', () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 1000; i++) {
      expect(() => limiter.check('publicTool', null)).not.toThrow();
    }
  });

  it('tracks each tool independently — one tool being over limit does not affect another', () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 3; i++) limiter.check('toolC', { limit: 3, window: '1m' });
    expect(() => limiter.check('toolC', { limit: 3, window: '1m' })).toThrow();
    // toolD is a DIFFERENT tool — must not be affected by toolC's exhausted bucket.
    expect(() => limiter.check('toolD', { limit: 3, window: '1m' })).not.toThrow();
  });

  it('resets the window after the configured duration (deterministic clock)', () => {
    let now = 0;
    const limiter = new RateLimiter(() => now);
    limiter.check('toolE', { limit: 1, window: '1s' });
    expect(() => limiter.check('toolE', { limit: 1, window: '1s' })).toThrow(RateLimitExceededError);
    now += 1_001; // past the 1s window
    expect(() => limiter.check('toolE', { limit: 1, window: '1s' })).not.toThrow();
  });

  it('reports a retryAfterMs consistent with the window', () => {
    let now = 0;
    const limiter = new RateLimiter(() => now);
    limiter.check('toolF', { limit: 1, window: '10s' });
    try {
      limiter.check('toolF', { limit: 1, window: '10s' });
      expect.fail('expected RateLimitExceededError');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitExceededError);
      const rle = err as RateLimitExceededError;
      expect(rle.retryAfterMs).toBeGreaterThan(9_000);
      expect(rle.retryAfterMs).toBeLessThanOrEqual(10_000);
    }
  });

  it('parses hour windows correctly', () => {
    let now = 0;
    const limiter = new RateLimiter(() => now);
    limiter.check('toolG', { limit: 1, window: '1h' });
    expect(() => limiter.check('toolG', { limit: 1, window: '1h' })).toThrow();
    now += 3_600_000 + 1;
    expect(() => limiter.check('toolG', { limit: 1, window: '1h' })).not.toThrow();
  });

  it('falls back to a 60s window for an unrecognized unit string (fail toward the safer default)', () => {
    // NEGATIVE ARM: an OpenAPI spec author who typed "1d" (days — not one of s/m/h) would silently
    // get an UNBOUNDED window without this fallback (the regex would never match, and a naive
    // implementation might treat "no match" as "no limit"). This proves it degrades to the
    // SHORTER, safer 60s window instead.
    let now = 0;
    const limiter = new RateLimiter(() => now);
    limiter.check('toolH', { limit: 1, window: '1d' });
    expect(() => limiter.check('toolH', { limit: 1, window: '1d' })).toThrow(RateLimitExceededError);
    now += 60_000 + 1; // past the 60s fallback window
    expect(() => limiter.check('toolH', { limit: 1, window: '1d' })).not.toThrow();
  });
});
