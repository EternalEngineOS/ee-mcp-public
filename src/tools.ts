/**
 * Wires GENERATED_TOOLS (build-time codegen output) into runnable MCP tools:
 * Zod input validation (E03), a Zod-derived JSON Schema for MCP's ListTools
 * response, per-tool rate limiting, and the actual GET call.
 *
 * SECURITY INVARIANT this file exists to hold the line on: every entry in
 * GENERATED_TOOLS has method 'GET' by construction (see scripts/codegen.mjs
 * deriveTools()). This module never adds a code path that could turn a GET
 * into a write — there is no request body anywhere below, and getJson()
 * hard-codes `method: 'GET'` rather than reading it from the tool, so even a
 * corrupted/hand-edited generated-tools.ts could not smuggle a write verb
 * through this layer.
 */
import { z } from 'zod';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GENERATED_TOOLS, type GeneratedTool } from './generated-tools.js';
import { buildInputSchema, buildJsonSchema, buildRequestPath } from './zod-from-params.js';
import { getJson, ApiError, ApiTimeoutError, type ClientConfig, type FetchLike } from './client.js';
import { RateLimiter, RateLimitExceededError } from './rate-limiter.js';

export interface RunnableTool {
  definition: Tool;
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  source: GeneratedTool;
}

/** Builds the static MCP tool list (name + description + JSON Schema) — this
 * is what ListTools returns, and it never touches the network. */
export function buildRunnableTools(tools: GeneratedTool[] = GENERATED_TOOLS): RunnableTool[] {
  return tools.map((source) => {
    const schema = buildInputSchema(source.params);
    const rateLimitNote = source.rateLimit ? ` (rate limit: ${source.rateLimit.limit} requests per ${source.rateLimit.window})` : '';
    const authNote = source.requiresAuth ? '' : ' This endpoint requires no authentication.';
    const definition: Tool = {
      name: source.name,
      description: `${source.summary}${rateLimitNote}${authNote} Read-only (GET ${source.path}).`,
      inputSchema: buildJsonSchema(source.params) as Tool['inputSchema'],
    };
    return { definition, schema, source };
  });
}

/** Executes one tool call. Returns an MCP CallToolResult — errors are
 * reported as `isError: true` results, NEVER thrown across the MCP
 * boundary (a thrown exception from a tool handler is a protocol violation
 * for most clients; a structured error result is the correct MCP shape). */
export async function runTool(
  runnable: RunnableTool,
  rawInput: Record<string, unknown>,
  config: ClientConfig,
  rateLimiter: RateLimiter,
  fetchImpl?: FetchLike,
): Promise<CallToolResult> {
  const parsed = runnable.schema.safeParse(rawInput);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { content: [{ type: 'text', text: `Invalid input: ${issues}` }], isError: true };
  }

  try {
    rateLimiter.check(runnable.source.name, runnable.source.rateLimit);
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { content: [{ type: 'text', text: err.message }], isError: true };
    }
    throw err;
  }

  const path = buildRequestPath(runnable.source.path, runnable.source.params, parsed.data);

  try {
    const data = await getJson(path, config, fetchImpl);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (err) {
    if (err instanceof ApiError) {
      const retrySuffix = err.retryAfterSeconds ? ` Retry after ${err.retryAfterSeconds}s.` : '';
      return { content: [{ type: 'text', text: `${err.message}${retrySuffix}` }], isError: true };
    }
    if (err instanceof ApiTimeoutError) {
      return { content: [{ type: 'text', text: err.message }], isError: true };
    }
    // Unknown error shape — still a structured MCP result, never a thrown value (E08).
    return { content: [{ type: 'text', text: `Unexpected error calling ${path}: ${(err as Error).message}` }], isError: true };
  }
}
