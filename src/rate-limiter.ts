/**
 * Per-process, per-tool sliding-window rate limiter matching each tool's
 * `x-rate-limit` (sourced from the gateway's own limit — see
 * scripts/growth/gen-public-openapi.mjs GATEWAY_RATE_LIMIT). This is a
 * client-side courtesy limit, not a security boundary — the server's own
 * limiter is the real enforcement. Its purpose is to fail an over-quota call
 * FAST with a clear message instead of burning the caller's server-side
 * quota on a 429 round-trip, and to be a good citizen if many tool calls
 * fire in a short burst (an AI agent iterating).
 */

export interface RateLimit {
  limit: number;
  window: string; // e.g. '1m'
}

function windowToMs(window: string): number {
  const match = /^(\d+)(s|m|h)$/.exec(window);
  if (!match) return 60_000; // unrecognized unit — fail toward the safer (shorter) default
  const [, n, unit] = match;
  const value = Number(n);
  const factor = unit === 's' ? 1_000 : unit === 'm' ? 60_000 : 3_600_000;
  return value * factor;
}

export class RateLimitExceededError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly retryAfterMs: number,
  ) {
    super(`Rate limit exceeded for ${toolName}. Retry after ${Math.ceil(retryAfterMs / 1000)}s.`);
    this.name = 'RateLimitExceededError';
  }
}

/** A separate bucket per tool name. `now` is injectable for deterministic tests. */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  // E01-exempt: this package is intentionally self-contained (npm-distributable, runs on a
  // third party's machine with zero dependency on @eternalengine/services-shared or any other
  // internal workspace package — see README.md "no dependency on the monorepo layout at
  // runtime"), so it cannot import systemTime/dateUtils. The E01 intent — deterministic,
  // testable time, never a bare unmockable now() — is preserved by making the clock injectable:
  // every test in tests/rate-limiter.test.ts passes a fixed `now` function instead of relying on
  // wall-clock time (see the mutation-tested arms there).
  constructor(private readonly now: () => number = () => Date.now()) {}

  /** Throws RateLimitExceededError if this call would exceed the tool's limit;
   * otherwise records the call and returns. */
  check(toolName: string, limit: RateLimit | null): void {
    if (!limit) return; // no limit configured (e.g. a public, unauthenticated tool) — nothing to enforce
    const windowMs = windowToMs(limit.window);
    const nowMs = this.now();
    const cutoff = nowMs - windowMs;
    const existing = (this.hits.get(toolName) ?? []).filter((t) => t > cutoff);
    if (existing.length >= limit.limit) {
      const oldest = existing[0]!;
      throw new RateLimitExceededError(toolName, oldest + windowMs - nowMs);
    }
    existing.push(nowMs);
    this.hits.set(toolName, existing);
  }
}
