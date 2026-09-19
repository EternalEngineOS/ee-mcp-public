# ee-mcp-public

A **read-only** [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for the
EternalEngine public API. It runs on **your** machine (or your CI, or your agent's sandbox),
authenticated with **your own** API key. It has **43 tools, one per public `GET` endpoint, and no
others** — there is no write tool anywhere in this package, and none can be added without editing
[`scripts/codegen.mjs`](./scripts/codegen.mjs) or the public spec it reads from
([EternalEngineOS/openapi](https://github.com/EternalEngineOS/openapi)).

## The read-only guarantee

Every tool corresponds to exactly one `GET` operation. `deriveTools()` in `scripts/codegen.mjs`
reads only `paths[path].get` — structurally, there is no code path anywhere in this repository
that constructs a request body or issues any HTTP method other than `GET`
(`src/client.ts`'s `getJson()` hard-codes `method: 'GET'`). A checked-in drift test
(`tests/codegen.test.ts`) fails the build if the generated tool list and the source spec ever
disagree.

This package:
- Cannot write, modify, or delete anything on EternalEngine, by construction.
- Cannot bypass your own authorization — every request carries exactly the key you supply.
- Cannot read local files, invoke a shell, or reach any host other than `EE_API_BASE`.
- Cannot see or exfiltrate your MCP client's other tools, prompts, or conversation context.

Read [`THREAT-MODEL.md`](./THREAT-MODEL.md) for the full trust boundary, including the honest
bound on what a *leaked* API key can do (this package narrows the blast radius of a key used
*through it*; it cannot narrow the blast radius of the key itself once it exists).

## Get your API key

Mint one from the [EternalEngine developers page](https://eternalengineos.io/developers). Keys
are per-app:

| App | Key prefix | Mint from |
|---|---|---|
| PostFrame (email, contacts, audiences, analytics) | `pf_live_*` / `pf_test_*` | `app.eternalengineos.io/postframe/developers` |
| PayGate (transactions, disputes, customers, payouts) | `pg_live_*` / `pg_test_*` | `app.eternalengineos.io/paygate/developers` |

## Install & run

**Publishing to npm is in progress; until then, run from source.** These exact commands are
verified against this repository:

```bash
git clone https://github.com/EternalEngineOS/ee-mcp-public.git
cd ee-mcp-public
pnpm install
pnpm build
EE_API_KEY=pf_live_your_key node dist/index.js
```

Once published, the same thing will be `EE_API_KEY=pf_live_your_key npx ee-mcp-public`.

### Claude Desktop

Add to your `claude_desktop_config.json` (until the npm package ships, point `command`/`args` at
your local clone's `dist/index.js` instead of `npx`):

```json
{
  "mcpServers": {
    "eternalengine": {
      "command": "node",
      "args": ["/absolute/path/to/ee-mcp-public/dist/index.js"],
      "env": { "EE_API_KEY": "pf_live_your_key" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add eternalengine --env EE_API_KEY=pf_live_your_key -- node /absolute/path/to/ee-mcp-public/dist/index.js
```

### Cursor

Add to your MCP config (`~/.cursor/mcp.json` or the project's `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "eternalengine": {
      "command": "node",
      "args": ["/absolute/path/to/ee-mcp-public/dist/index.js"],
      "env": { "EE_API_KEY": "pf_live_your_key" }
    }
  }
}
```

### Any other MCP client

This is a standard stdio MCP server (`@modelcontextprotocol/sdk`, `StdioServerTransport`). Point
your client's config at `node /absolute/path/to/ee-mcp-public/dist/index.js` with `EE_API_KEY`
set in its environment.

## Configuration (env vars only — no config file, no CLI flags for secrets)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `EE_API_KEY` | **Yes** | — | Your PostFrame (`pf_*`) or PayGate (`pg_*`) API key. The process exits with a clear message if unset. |
| `EE_API_BASE` | No | `https://app.eternalengineos.io/api/v1` | Override for testing against a non-production instance. |
| `EE_API_TIMEOUT_MS` | No | `15000` | Per-request timeout. Every request is bounded — there is no unbounded network wait. |

## What each tool does

Every tool corresponds to exactly one `GET` operation in the public OpenAPI spec published at
[EternalEngineOS/openapi](https://github.com/EternalEngineOS/openapi), human-readable at
[eternalengineos.io/developers](https://eternalengineos.io/developers). Tool names are the spec's
`operationId`s (e.g. `listMessages`, `getAnalyticsOverview`, `getConnectBalance`). This package
ships **43 tools**, counted directly from the generated tool list
(`src/generated-tools.ts`, produced by `scripts/codegen.mjs` from `spec/openapi.public.json`).

Each tool call:
1. Validates its input against a Zod schema derived from the spec's parameters.
2. Checks a client-side rate limiter matching the tool's documented limit — a courtesy that fails
   fast locally instead of burning your server-side quota on a round-trip to get a `429`.
3. Sends exactly one `GET` request with `Authorization: Bearer <your key>`, bounded by
   `AbortSignal.timeout`.
4. Returns the JSON response as MCP tool output, or a structured error (`isError: true`) — this
   process never throws an unhandled exception across the MCP boundary.

## Rate limits

Each tool's description states its rate limit, sourced from the spec's `x-rate-limit` field. The
client-side limiter in this package (`src/rate-limiter.ts`) enforces the same number locally; the
EternalEngine gateway enforces it too and is the actual authority. A `429` from the server is
returned as a tool error with the `Retry-After` value, never retried silently.

## Development

```bash
pnpm install
pnpm codegen     # regenerate src/generated-tools.ts from spec/openapi.public.json
pnpm build       # codegen + tsc
pnpm test        # vitest — 56 tests, zero network calls (all fetches mocked)
pnpm typecheck
```

To pick up a spec change: update `spec/openapi.public.json` from
[EternalEngineOS/openapi](https://github.com/EternalEngineOS/openapi), then `pnpm codegen`. The
checked-in drift test (`tests/codegen.test.ts`) fails if `src/generated-tools.ts` and the spec
ever disagree.

## Security

Read [`THREAT-MODEL.md`](./THREAT-MODEL.md) first. Found a way for this package to do something
that document says it cannot? That is a real finding — open an issue at
[EternalEngineOS/.github](https://github.com/EternalEngineOS/.github/issues) or email
`security@eternalengineos.io`.

## Support

General questions or bugs: open an issue at
[EternalEngineOS/.github](https://github.com/EternalEngineOS/.github/issues).

## License

MIT — see [LICENSE](./LICENSE).
