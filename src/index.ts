#!/usr/bin/env node
/**
 * ee-mcp-public — a read-only Model Context Protocol server for the
 * EternalEngine public API. Runs on the USER's machine with the USER's own
 * API key. See THREAT-MODEL.md for the full trust boundary.
 *
 * SECURITY POSTURE (also documented in THREAT-MODEL.md — read that first):
 *   - No write tools. Every tool is a GET, generated from the public spec.
 *   - No local file access, no shell access, no arbitrary network egress —
 *     the only host this process ever talks to is `EE_API_BASE`.
 *   - No auth bypass — every call carries the user's own Bearer key; this
 *     process never stores, transmits, or logs that key anywhere but the
 *     Authorization header of the request it is attached to.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { loadConfig, ConfigError } from './config.js';
import { buildRunnableTools, runTool } from './tools.js';
import { RateLimiter } from './rate-limiter.js';

const VERSION = '0.1.0';

export async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      process.stderr.write(`[ee-mcp-public] ${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }

  const runnables = buildRunnableTools();
  const byName = new Map(runnables.map((r) => [r.definition.name, r]));
  const rateLimiter = new RateLimiter();

  const server = new Server(
    { name: 'ee-mcp-public', version: VERSION },
    {
      capabilities: { tools: {} },
      instructions:
        'This server exposes READ-ONLY access to the EternalEngine public API using your own ' +
        'API key. Every tool is a GET request — there is no way to write, modify, or delete data ' +
        'through this server. Rate limits are enforced both here and by the server.',
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: runnables.map((r) => r.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const runnable = byName.get(name);
    if (!runnable) {
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
    return runTool(runnable, args as Record<string, unknown>, config, rateLimiter);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`[ee-mcp-public] v${VERSION} started | ${runnables.length} read-only tools | base=${config.apiBase}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`[ee-mcp-public] fatal: ${(err as Error).message}\n`);
    process.exit(1);
  });
}
