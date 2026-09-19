#!/usr/bin/env node
/**
 * codegen.mjs — derives this package's MCP tool list from the PUBLIC openapi
 * spec at BUILD TIME, and bakes it into src/generated-tools.ts as a literal
 * TypeScript array. This is the mechanism that makes the tool list
 * un-driftable from the spec: `deriveTools()` is the single function both
 * this CLI and the package's own test suite call, so a test asserting
 * "generated tool names == spec operationIds" is asserting against the SAME
 * logic that produced the checked-in file, not a hand-copied summary of it.
 *
 * The output is a SELF-CONTAINED source file (no runtime read of the spec) —
 * `pnpm build` runs this once, against the copy of the public spec checked
 * into `spec/openapi.public.json` in this repository (mirrored from
 * https://github.com/EternalEngineOS/openapi, the canonical source of that
 * spec). The resulting dist/ has no dependency on the spec at runtime, which
 * is required for `npx ee-mcp-public` to work from an npm tarball.
 *
 * Every tool here corresponds to exactly ONE GET operation. There is no path
 * by which a write verb reaches this array — deriveTools() reads only
 * `paths[path].get`, structurally.
 *
 * Usage: node scripts/codegen.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = join(HERE, '..');
export const SPEC_PATH = join(PACKAGE_ROOT, 'spec/openapi.public.json');
export const OUT_PATH = join(PACKAGE_ROOT, 'src/generated-tools.ts');

/**
 * @typedef {{ name: string; in: string; required: boolean; type: string; description?: string }} ToolParam
 * @typedef {{
 *   name: string;
 *   summary: string;
 *   method: 'GET';
 *   path: string;
 *   params: ToolParam[];
 *   rateLimit: { limit: number; window: string } | null;
 *   requiresAuth: boolean;
 * }} GeneratedTool
 */

/** Map an OpenAPI `schema.type` to a name buildInputSchema() understands.
 * Deliberately narrow — an unrecognized type falls back to 'string' rather
 * than throwing, because a public spec parameter type this package has never
 * seen should degrade to "accept a string", not break codegen. */
function normalizeType(schema) {
  const t = schema?.type;
  if (t === 'integer' || t === 'number' || t === 'boolean') return t;
  return 'string';
}

/** Pure function: openapi spec object -> GeneratedTool[]. No I/O. Exported so
 * the test suite can call it directly against the checked-in spec and compare
 * against the checked-in generated-tools.ts, proving the two cannot drift
 * without the test catching it. */
export function deriveTools(spec) {
  const tools = [];
  const paths = spec.paths ?? {};
  for (const [path, ops] of Object.entries(paths)) {
    const op = ops.get;
    if (!op) continue; // structural GET-only filter
    if (!op.operationId) {
      throw new Error(`codegen: GET ${path} has no operationId — the public spec generator guarantees one; this means the spec was hand-edited or is stale`);
    }
    const params = (op.parameters ?? []).map((p) => ({
      name: p.name,
      in: p.in,
      required: !!p.required,
      type: normalizeType(p.schema),
      description: p.description,
    }));
    const isPublic = Array.isArray(op.security) && op.security.length === 0;
    tools.push({
      name: op.operationId,
      summary: op.summary ?? op.description ?? op.operationId,
      method: 'GET',
      path,
      params,
      rateLimit: op['x-rate-limit'] ? { limit: op['x-rate-limit'].limit, window: op['x-rate-limit'].window } : null,
      requiresAuth: !isPublic,
    });
  }
  // Sorted for a deterministic, diff-friendly generated file.
  return tools.sort((a, b) => a.name.localeCompare(b.name));
}

function renderTypeScript(tools) {
  const header = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Produced by scripts/codegen.mjs from spec/openapi.public.json (mirrored
 * from https://github.com/EternalEngineOS/openapi).
 * Run \`pnpm codegen\` (or \`pnpm build\`) to regenerate.
 * Every entry corresponds to exactly one GET operation in the public spec —
 * there is no write tool here, and none can be added without editing this
 * generator or the source spec it reads.
 */

export interface GeneratedToolParam {
  name: string;
  in: string;
  required: boolean;
  type: 'string' | 'integer' | 'number' | 'boolean';
  description?: string;
}

export interface GeneratedTool {
  name: string;
  summary: string;
  method: 'GET';
  path: string;
  params: GeneratedToolParam[];
  rateLimit: { limit: number; window: string } | null;
  requiresAuth: boolean;
}

export const GENERATED_TOOLS: GeneratedTool[] = `;
  return header + JSON.stringify(tools, null, 2) + ';\n';
}

function main() {
  if (!existsSync(SPEC_PATH)) {
    console.error(`codegen: spec not found at ${SPEC_PATH}. Restore spec/openapi.public.json from https://github.com/EternalEngineOS/openapi first.`);
    process.exit(2);
  }
  const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf-8'));
  const tools = deriveTools(spec);
  writeFileSync(OUT_PATH, renderTypeScript(tools), 'utf-8');
  console.log(`codegen: wrote ${OUT_PATH} (${tools.length} tools)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
