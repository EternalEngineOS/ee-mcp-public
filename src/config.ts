/**
 * Config — env-only, per the package's design contract (no CLI flags for
 * secrets, no config file that could leak a key onto disk unexpectedly).
 */
import { z } from 'zod';

const configSchema = z.object({
  apiKey: z.string().min(8, 'EE_API_KEY looks too short to be a real key'),
  apiBase: z.string().url().default('https://app.eternalengineos.io/api/v1'),
  timeoutMs: z.coerce.number().int().positive().default(15_000),
});

export type Config = z.infer<typeof configSchema>;

export class ConfigError extends Error {}

/** Reads config from `process.env`. Never logs the key. Throws ConfigError
 * with a human-readable message (not a raw ZodError) so the CLI can print
 * something a developer can act on immediately. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiKey = env['EE_API_KEY'];
  if (!apiKey) {
    throw new ConfigError(
      'EE_API_KEY is not set. Get a key from https://app.eternalengineos.io (Developers → API Keys) ' +
        'and run: EE_API_KEY=pf_live_your_key npx ee-mcp-public',
    );
  }
  const result = configSchema.safeParse({
    apiKey,
    apiBase: env['EE_API_BASE'] || undefined,
    timeoutMs: env['EE_API_TIMEOUT_MS'] || undefined,
  });
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ConfigError(`Invalid configuration: ${issues}`);
  }
  return result.data;
}
