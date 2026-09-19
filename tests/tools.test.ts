import { describe, it, expect, vi } from 'vitest';
import { buildRunnableTools, runTool } from '../src/tools.js';
import { RateLimiter } from '../src/rate-limiter.js';
import { GENERATED_TOOLS } from '../src/generated-tools.js';
import type { FetchLike } from '../src/client.js';

const CONFIG = { apiBase: 'https://app.eternalengineos.io/api/v1', apiKey: 'pf_live_testkey', timeoutMs: 5000 };

describe('buildRunnableTools', () => {
  it('derives one MCP tool per generated tool, name-for-name', () => {
    const runnables = buildRunnableTools();
    expect(runnables).toHaveLength(GENERATED_TOOLS.length);
    expect(new Set(runnables.map((r) => r.definition.name))).toEqual(new Set(GENERATED_TOOLS.map((t) => t.name)));
  });

  it('NEGATIVE ARM: contains zero write-shaped tools — every tool description says GET', () => {
    // This is the assertion that would have failed had buildTool() ever read `source.method`
    // instead of hard-coding GET semantics — see the SECURITY INVARIANT note at the top of
    // src/tools.ts. Every GeneratedTool.method is already 'GET' by codegen construction, so this
    // also guards against a future GENERATED_TOOLS entry smuggling in a different verb.
    const runnables = buildRunnableTools();
    for (const r of runnables) {
      expect(r.source.method).toBe('GET');
      expect(r.definition.description).toMatch(/Read-only \(GET /);
    }
  });

  it('every tool has a valid MCP inputSchema (object type)', () => {
    const runnables = buildRunnableTools();
    for (const r of runnables) {
      expect((r.definition.inputSchema as { type: string }).type).toBe('object');
    }
  });
});

describe('runTool', () => {
  it('rejects invalid input before ever calling fetch', async () => {
    const runnables = buildRunnableTools();
    const withRequiredParam = runnables.find((r) => r.source.params.some((p) => p.required || p.in === 'path'));
    expect(withRequiredParam, 'expected at least one tool with a required/path param to test against').toBeDefined();
    const fetchSpy = vi.fn() as unknown as FetchLike;
    const result = await runTool(withRequiredParam!, {}, CONFIG, new RateLimiter(), fetchSpy);
    expect(result.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns a successful CallToolResult with the fetched JSON on the happy path', async () => {
    const runnables = buildRunnableTools();
    const simple = runnables.find((r) => r.source.params.length === 0) ?? runnables[0]!;
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'ok' }),
    })) as unknown as FetchLike;
    const input: Record<string, unknown> = {};
    for (const p of simple.source.params) if (p.required || p.in === 'path') input[p.name] = 'x';
    const result = await runTool(simple, input, CONFIG, new RateLimiter(), fetchImpl);
    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toMatchObject({ type: 'text' });
  });

  it('a 429 from the server surfaces as an isError result with retry guidance, never a thrown exception', async () => {
    const runnables = buildRunnableTools();
    const simple = runnables.find((r) => r.source.params.length === 0) ?? runnables[0]!;
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '12' }),
    })) as unknown as FetchLike;
    const input: Record<string, unknown> = {};
    for (const p of simple.source.params) if (p.required || p.in === 'path') input[p.name] = 'x';
    const result = await runTool(simple, input, CONFIG, new RateLimiter(), fetchImpl);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toMatch(/Retry after 12s/);
  });

  it('the client-side rate limiter refuses an over-quota call WITHOUT hitting the network', async () => {
    const runnables = buildRunnableTools();
    const limited = runnables.find((r) => r.source.rateLimit !== null);
    expect(limited, 'expected at least one tool with a rate limit to test against').toBeDefined();
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) })) as unknown as FetchLike;
    const limiter = new RateLimiter();
    const input: Record<string, unknown> = {};
    for (const p of limited!.source.params) if (p.required || p.in === 'path') input[p.name] = 'x';
    const cap = limited!.source.rateLimit!.limit;
    for (let i = 0; i < cap; i++) await runTool(limited!, input, CONFIG, limiter, fetchImpl);
    fetchImpl.mockClear();
    const overCap = await runTool(limited!, input, CONFIG, limiter, fetchImpl);
    expect(overCap.isError).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('a timeout surfaces as an isError result, not an unhandled rejection', async () => {
    const runnables = buildRunnableTools();
    const simple = runnables.find((r) => r.source.params.length === 0) ?? runnables[0]!;
    const fetchImpl = vi.fn(async () => {
      const err = new Error('timeout');
      err.name = 'TimeoutError';
      throw err;
    }) as unknown as FetchLike;
    const input: Record<string, unknown> = {};
    for (const p of simple.source.params) if (p.required || p.in === 'path') input[p.name] = 'x';
    const result = await runTool(simple, input, CONFIG, new RateLimiter(), fetchImpl);
    expect(result.isError).toBe(true);
  });

  it('a 429 with no Retry-After header omits the retry suffix rather than printing "Retry after undefineds."', async () => {
    const runnables = buildRunnableTools();
    const simple = runnables.find((r) => r.source.params.length === 0) ?? runnables[0]!;
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 429, headers: new Headers() })) as unknown as FetchLike;
    const input: Record<string, unknown> = {};
    for (const p of simple.source.params) if (p.required || p.in === 'path') input[p.name] = 'x';
    const result = await runTool(simple, input, CONFIG, new RateLimiter(), fetchImpl);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).not.toMatch(/Retry after/);
  });

});
