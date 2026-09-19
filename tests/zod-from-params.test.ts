import { describe, it, expect } from 'vitest';
import { buildInputSchema, buildJsonSchema, buildRequestPath } from '../src/zod-from-params.js';
import type { GeneratedToolParam } from '../src/generated-tools.js';

const idParam: GeneratedToolParam = { name: 'id', in: 'path', required: false, type: 'string' };
const limitParam: GeneratedToolParam = { name: 'limit', in: 'query', required: false, type: 'integer' };
const statusParam: GeneratedToolParam = { name: 'status', in: 'query', required: true, type: 'string' };
const feeParam: GeneratedToolParam = { name: 'fee', in: 'query', required: false, type: 'number' };
const activeParam: GeneratedToolParam = { name: 'active', in: 'query', required: false, type: 'boolean' };

describe('buildInputSchema', () => {
  it('treats every path param as required regardless of the spec flag', () => {
    const schema = buildInputSchema([idParam]);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ id: 'abc' }).success).toBe(true);
  });

  it('makes an optional query param optional', () => {
    const schema = buildInputSchema([limitParam]);
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('makes a required query param required', () => {
    const schema = buildInputSchema([statusParam]);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ status: 'x' }).success).toBe(true);
  });

  it('coerces an integer query param and rejects a non-integer', () => {
    const schema = buildInputSchema([limitParam]);
    const ok = schema.safeParse({ limit: '10' });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data['limit']).toBe(10);
    expect(schema.safeParse({ limit: '10.5' }).success).toBe(false);
  });

  it('rejects an unknown extra field is NOT enforced by default (documented, non-strict) — but valid fields still validate', () => {
    const schema = buildInputSchema([statusParam]);
    // z.object is non-strict by default; this documents the behavior rather than assuming strictness.
    const result = schema.safeParse({ status: 'x', extra: 'y' });
    expect(result.success).toBe(true);
  });

  it('coerces a "number" param (non-integer) and rejects a non-numeric string', () => {
    const schema = buildInputSchema([feeParam]);
    const ok = schema.safeParse({ fee: '19.99' });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data['fee']).toBe(19.99);
    expect(schema.safeParse({ fee: 'not-a-number' }).success).toBe(false);
  });

  it('coerces a "boolean" param', () => {
    const schema = buildInputSchema([activeParam]);
    const ok = schema.safeParse({ active: 'true' });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data['active']).toBe(true);
  });
});

describe('buildJsonSchema', () => {
  it('marks path params and required query params as required', () => {
    const schema = buildJsonSchema([idParam, statusParam, limitParam]);
    expect(schema.required).toContain('id');
    expect(schema.required).toContain('status');
    expect(schema.required).not.toContain('limit');
  });

  it('produces a JSON Schema type matching each param type', () => {
    const schema = buildJsonSchema([limitParam]);
    expect(schema.properties['limit']?.type).toBe('integer');
  });

  it('never emits a "params" array-shaped schema — always a flat object', () => {
    const schema = buildJsonSchema([idParam]);
    expect(schema.type).toBe('object');
  });
});

describe('buildRequestPath', () => {
  it('substitutes a path param into the URL template', () => {
    const path = buildRequestPath('/emails/{id}', [idParam], { id: 'abc123' });
    expect(path).toBe('/emails/abc123');
  });

  it('URL-encodes a path param value', () => {
    const path = buildRequestPath('/customers/{email}', [{ name: 'email', in: 'path', required: true, type: 'string' }], {
      email: 'a+b@example.com',
    });
    expect(path).toBe('/customers/a%2Bb%40example.com');
  });

  it('appends query params, omitting undefined values', () => {
    const path = buildRequestPath('/emails', [limitParam, statusParam], { limit: 10 });
    expect(path).toBe('/emails?limit=10');
  });

  it('produces no trailing "?" when there are no query params to send', () => {
    const path = buildRequestPath('/emails/{id}', [idParam], { id: 'x' });
    expect(path).toBe('/emails/x');
  });

  it('combines path substitution and query params together', () => {
    const path = buildRequestPath('/transactions/{id}', [idParam, limitParam], { id: 'txn1', limit: 5 });
    expect(path).toBe('/transactions/txn1?limit=5');
  });
});
