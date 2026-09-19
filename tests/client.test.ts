import { describe, it, expect, vi } from 'vitest';
import { getJson, ApiError, ApiTimeoutError, type FetchLike } from '../src/client.js';

const CONFIG = { apiBase: 'https://app.eternalengineos.io/api/v1', apiKey: 'pf_live_testkey', timeoutMs: 5000 };

function fakeFetch(response: Partial<Response> & { json?: () => Promise<unknown>; text?: () => Promise<string> }): FetchLike {
  return vi.fn(async () => response as Response) as unknown as FetchLike;
}

describe('getJson — happy path', () => {
  it('sends the Authorization header and returns parsed JSON on 200', async () => {
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer pf_live_testkey');
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ hello: 'world' }),
      } as unknown as Response;
    }) as unknown as FetchLike;

    const result = await getJson('/postframe/emails', CONFIG, fetchImpl);
    expect(result).toEqual({ hello: 'world' });
  });

  it('attaches a bounded AbortSignal (E08) to every request', async () => {
    let sawSignal: AbortSignal | undefined;
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      sawSignal = init?.signal ?? undefined;
      return { ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) } as unknown as Response;
    }) as unknown as FetchLike;
    await getJson('/postframe/emails', CONFIG, fetchImpl);
    expect(sawSignal).toBeInstanceOf(AbortSignal);
  });

  it('returns a descriptive non-JSON placeholder for a binary/PDF response instead of throwing', async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/pdf' }) });
    const result = (await getJson('/paygate/me/invoices/in_123/pdf', CONFIG, fetchImpl)) as { note: string };
    expect(result.note).toMatch(/not JSON/i);
  });
});

describe('getJson — error mapping', () => {
  it('maps 401 to a clear ApiError, never a raw fetch error', async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 401, headers: new Headers() });
    await expect(getJson('/postframe/emails', CONFIG, fetchImpl)).rejects.toThrow(ApiError);
    await expect(getJson('/postframe/emails', CONFIG, fetchImpl)).rejects.toThrow(/Unauthorized/);
  });

  it('maps 403 to ApiError', async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 403, headers: new Headers() });
    await expect(getJson('/paygate/transactions', CONFIG, fetchImpl)).rejects.toThrow(/Forbidden/);
  });

  it('maps 429 to ApiError and carries retryAfterSeconds from the Retry-After header', async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 429, headers: new Headers({ 'retry-after': '30' }) });
    try {
      await getJson('/postframe/emails', CONFIG, fetchImpl);
      expect.fail('expected ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(429);
      expect((err as ApiError).retryAfterSeconds).toBe(30);
    }
  });

  it('maps other non-2xx statuses to ApiError with the status code attached', async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 500, headers: new Headers(), text: async () => 'boom' });
    try {
      await getJson('/postframe/emails', CONFIG, fetchImpl);
      expect.fail('expected ApiError');
    } catch (err) {
      expect((err as ApiError).status).toBe(500);
    }
  });

  it('maps a fetch AbortError/TimeoutError to ApiTimeoutError, not a raw exception', async () => {
    const fetchImpl = vi.fn(async () => {
      const err = new Error('timed out');
      err.name = 'TimeoutError';
      throw err;
    }) as unknown as FetchLike;
    await expect(getJson('/postframe/emails', CONFIG, fetchImpl)).rejects.toThrow(ApiTimeoutError);
  });

  it('maps a generic network failure to ApiError rather than propagating an unhandled rejection', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as FetchLike;
    await expect(getJson('/postframe/emails', CONFIG, fetchImpl)).rejects.toThrow(ApiError);
  });

  it('never includes the API key in a thrown error message', async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 500, headers: new Headers(), text: async () => 'server error' });
    try {
      await getJson('/postframe/emails', CONFIG, fetchImpl);
      expect.fail('expected ApiError');
    } catch (err) {
      expect((err as Error).message).not.toContain(CONFIG.apiKey);
    }
  });

  it('a 429 with no Retry-After header leaves retryAfterSeconds undefined rather than NaN', async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 429, headers: new Headers() });
    try {
      await getJson('/postframe/emails', CONFIG, fetchImpl);
      expect.fail('expected ApiError');
    } catch (err) {
      expect((err as ApiError).retryAfterSeconds).toBeUndefined();
    }
  });

  it('still throws an ApiError, with an empty body, when reading a non-2xx response body itself throws (E08: bounded, never an unhandled rejection)', async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 500,
      headers: new Headers(),
      text: async () => {
        throw new Error('stream already consumed');
      },
    });
    try {
      await getJson('/postframe/emails', CONFIG, fetchImpl);
      expect.fail('expected ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).message).toBe('Request to /postframe/emails failed with status 500');
    }
  });
});
