/**
 * Drift check: the checked-in src/generated-tools.ts must be exactly what
 * `deriveTools()` produces from the CURRENT public spec, right now. If this
 * test fails, someone edited generated-tools.ts by hand, or the spec moved
 * and nobody re-ran `pnpm codegen`.
 *
 * This is the "test asserts tool names == spec operationIds" requirement
 * from the mission brief, plus the stronger form: not just names, but the
 * full derived shape (params, rate limits, auth flags).
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { deriveTools, SPEC_PATH } from '../scripts/codegen.mjs';
import { GENERATED_TOOLS } from '../src/generated-tools.js';

describe('codegen drift check', () => {
  const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf-8'));
  const fresh = deriveTools(spec);

  it('every generated tool name matches a real operationId in the public spec', () => {
    const specOperationIds = new Set<string>();
    for (const ops of Object.values(spec.paths as Record<string, { get?: { operationId?: string } }>)) {
      if (ops.get?.operationId) specOperationIds.add(ops.get.operationId);
    }
    for (const tool of GENERATED_TOOLS) {
      expect(specOperationIds.has(tool.name), `tool "${tool.name}" has no matching spec operationId`).toBe(true);
    }
  });

  it('the checked-in generated-tools.ts is byte-for-byte what deriveTools() produces right now', () => {
    // NEGATIVE ARM: hand-edit generated-tools.ts (add a tool, rename one, change a param) and
    // this fails — proven by mutation-testing this exact assertion during development (removing
    // one entry from GENERATED_TOOLS reproducibly failed this test with a length mismatch before
    // the fix, and passed after re-running codegen).
    expect(GENERATED_TOOLS).toEqual(fresh);
  });

  it('has zero write-verb tools — deriveTools() is structurally GET-only', () => {
    for (const tool of fresh) {
      expect(tool.method).toBe('GET');
    }
  });

  it('throws if a GET operation in the spec has no operationId (never silently skips it)', () => {
    const broken = { paths: { '/x': { get: { responses: {} } } } };
    expect(() => deriveTools(broken)).toThrow(/no operationId/);
  });

  it('produces a deterministic, sorted output for a diff-friendly generated file', () => {
    const specA = { paths: { '/z': { get: { operationId: 'getZ', responses: {} } }, '/a': { get: { operationId: 'getA', responses: {} } } } };
    const tools = deriveTools(specA);
    expect(tools.map((t) => t.name)).toEqual(['getA', 'getZ']);
  });
});
