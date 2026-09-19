import { describe, it, expect } from 'vitest';
import { loadConfig, ConfigError } from '../src/config.js';

describe('loadConfig', () => {
  it('throws ConfigError with a clear, actionable message when EE_API_KEY is missing', () => {
    // NEGATIVE ARM: this is the exact user-facing failure the "key missing → clear error" done
    // criterion in the mission brief asks for. Before this check existed, a missing key would
    // have surfaced as a cryptic 401 from the FIRST network call instead of failing fast at
    // startup with instructions.
    expect(() => loadConfig({})).toThrow(ConfigError);
    try {
      loadConfig({});
    } catch (err) {
      expect((err as Error).message).toMatch(/EE_API_KEY is not set/);
      expect((err as Error).message).toMatch(/app\.eternalengineos\.io/);
    }
  });

  it('rejects a suspiciously short key rather than sending it', () => {
    expect(() => loadConfig({ EE_API_KEY: 'abc' })).toThrow(ConfigError);
  });

  it('defaults apiBase to the public app host', () => {
    const cfg = loadConfig({ EE_API_KEY: 'pf_live_deadbeef_0123456789abcdef0123456789abcdef' });
    expect(cfg.apiBase).toBe('https://app.eternalengineos.io/api/v1');
  });

  it('honors EE_API_BASE override', () => {
    const cfg = loadConfig({
      EE_API_KEY: 'pf_test_deadbeef_0123456789abcdef0123456789abcdef',
      EE_API_BASE: 'http://localhost:3000/api/v1',
    });
    expect(cfg.apiBase).toBe('http://localhost:3000/api/v1');
  });

  it('rejects a malformed EE_API_BASE', () => {
    expect(() =>
      loadConfig({ EE_API_KEY: 'pf_live_deadbeef_0123456789abcdef0123456789abcdef', EE_API_BASE: 'not-a-url' }),
    ).toThrow(ConfigError);
  });

  it('defaults the timeout to 15000ms and honors an override', () => {
    const cfg = loadConfig({ EE_API_KEY: 'pf_live_deadbeef_0123456789abcdef0123456789abcdef' });
    expect(cfg.timeoutMs).toBe(15_000);
    const overridden = loadConfig({
      EE_API_KEY: 'pf_live_deadbeef_0123456789abcdef0123456789abcdef',
      EE_API_TIMEOUT_MS: '5000',
    });
    expect(overridden.timeoutMs).toBe(5000);
  });

  it('never includes the raw key value in a thrown error message for an unrelated failure', () => {
    try {
      loadConfig({ EE_API_KEY: 'pf_live_super-secret-key-value', EE_API_BASE: 'not-a-url' });
      expect.fail('expected loadConfig to throw');
    } catch (err) {
      expect((err as Error).message).not.toContain('super-secret-key-value');
    }
  });
});
