/**
 * Thin GET-only HTTP client. E08: every fetch is bounded with
 * AbortSignal.timeout — no unbounded network wait. E04: the API key never
 * appears in a thrown error message or a log line, only in the Authorization
 * header of the actual request.
 */

export interface ClientConfig {
  apiBase: string;
  apiKey: string;
  timeoutMs: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiTimeoutError extends Error {
  constructor(path: string, timeoutMs: number) {
    super(`Request to ${path} timed out after ${timeoutMs}ms`);
    this.name = 'ApiTimeoutError';
  }
}

/** Injectable fetch implementation so tests never touch the network. */
export type FetchLike = typeof fetch;

export async function getJson(
  path: string,
  config: ClientConfig,
  fetchImpl: FetchLike = fetch,
): Promise<unknown> {
  const url = new URL(path, config.apiBase.endsWith('/') ? config.apiBase : config.apiBase + '/');
  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new ApiTimeoutError(path, config.timeoutMs);
    }
    throw new ApiError(`Network error calling ${path}: ${(err as Error).message}`, 0);
  }

  if (response.status === 429) {
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw new ApiError(`Rate limited by the server (429) calling ${path}`, 429, retryAfterSeconds);
  }
  if (response.status === 401) {
    throw new ApiError('Unauthorized (401) — the API key is missing, invalid, or revoked.', 401);
  }
  if (response.status === 403) {
    throw new ApiError('Forbidden (403) — the key does not have access to this resource.', 403);
  }
  if (!response.ok) {
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      // response body unreadable — fall through with what we have (E08: bounded, never rethrown as unhandled)
    }
    throw new ApiError(`Request to ${path} failed with status ${response.status}${bodyText ? `: ${bodyText.slice(0, 500)}` : ''}`, response.status);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    // e.g. the PDF invoice endpoints — return a description rather than binary bytes through an
    // MCP text channel, which cannot represent them usefully anyway.
    return { note: `Response was ${contentType || 'unknown content-type'}, not JSON — this tool returns metadata only via the MCP text channel. Download the resource directly with your API key if you need the raw bytes.`, url: url.toString() };
  }
  return await response.json();
}
