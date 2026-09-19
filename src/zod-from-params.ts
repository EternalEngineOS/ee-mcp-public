/**
 * Builds a Zod input schema for one MCP tool from its GeneratedToolParam[]
 * (which came off the OpenAPI spec's `parameters` array — see scripts/codegen.mjs).
 * E03: every tool input is Zod-parsed before it is ever used to build a URL —
 * `unknown`, never `any`, at this boundary.
 */
import { z, type ZodTypeAny } from 'zod';
import type { GeneratedToolParam } from './generated-tools.js';

function zodForType(type: GeneratedToolParam['type']): ZodTypeAny {
  switch (type) {
    case 'integer':
      return z.coerce.number().int();
    case 'number':
      return z.coerce.number();
    case 'boolean':
      return z.coerce.boolean();
    case 'string':
    default:
      return z.string();
  }
}

/** Build a Zod object schema for a tool's parameters. Path params are always
 * required regardless of what the spec says (a missing path param cannot
 * produce a valid URL); query params respect the spec's `required` flag. */
export function buildInputSchema(params: GeneratedToolParam[]): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const p of params) {
    let field = zodForType(p.type);
    if (p.description) field = field.describe(p.description);
    const isRequired = p.in === 'path' ? true : p.required;
    shape[p.name] = isRequired ? field : field.optional();
  }
  return z.object(shape);
}

/** JSON Schema `type` for a param, matching zodForType()'s choices exactly —
 * this is a direct hand-mapping from GeneratedToolParam, not a Zod
 * introspection library, so there is no peer-version dependency between this
 * package's zod range and a schema-conversion tool's. */
function jsonSchemaTypeFor(type: GeneratedToolParam['type']): string {
  return type; // 'string' | 'integer' | 'number' | 'boolean' are already valid JSON Schema type names
}

/** Build the JSON Schema MCP's ListTools response needs for one tool's
 * inputSchema, directly from the same param metadata buildInputSchema()
 * consumes — so the two can never describe different shapes. */
export function buildJsonSchema(params: GeneratedToolParam[]): {
  type: 'object';
  properties: Record<string, { type: string; description?: string }>;
  required: string[];
} {
  const properties: Record<string, { type: string; description?: string }> = {};
  const required: string[] = [];
  for (const p of params) {
    properties[p.name] = { type: jsonSchemaTypeFor(p.type), ...(p.description ? { description: p.description } : {}) };
    if (p.in === 'path' || p.required) required.push(p.name);
  }
  return { type: 'object', properties, required };
}

/** Substitute {param} path segments and build the query string from a
 * validated input object. Path params are consumed and removed; everything
 * else becomes a query param. */
export function buildRequestPath(
  templatePath: string,
  params: GeneratedToolParam[],
  input: Record<string, unknown>,
): string {
  let path = templatePath;
  const query = new URLSearchParams();
  for (const p of params) {
    const value = input[p.name];
    if (value === undefined || value === null) continue;
    if (p.in === 'path') {
      path = path.replace(`{${p.name}}`, encodeURIComponent(String(value)));
    } else {
      query.set(p.name, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}
