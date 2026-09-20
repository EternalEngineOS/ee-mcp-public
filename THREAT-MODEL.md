# Threat Model — ee-mcp-public

## What this is

A distributed (npm-installable) MCP server that a THIRD PARTY runs on THEIR OWN machine with
THEIR OWN EternalEngine API key. It is designed for **zero attack surface toward EternalEngine
itself** — the risk this document analyzes is what a leaked or malicious use of this package can
do, not what an attacker could do TO EternalEngine through it, because the two are structurally
the same question here: the only capability this package has is what the caller's own key already
grants at the server, minus every write the key could otherwise perform.

## Assets

| Asset | Where it lives | This package's relationship to it |
|---|---|---|
| The user's API key (`pf_*` / `pg_*`) | The user's own environment (`EE_API_KEY`) | Read once at startup, attached to the `Authorization` header of every request, never persisted, never logged. |
| The tenant's data (emails, contacts, transactions, disputes, …) | EternalEngine's servers | Read via the API, exactly as much as the key's own scope allows. This package adds no additional access. |
| The user's local machine | — | This package makes outbound HTTPS calls to `EE_API_BASE` only. No filesystem access beyond its own module resolution, no shell access, no other network egress. |

## Trust boundary

```
 ┌─────────────────────────────┐        HTTPS, Bearer <user's key>       ┌──────────────────────┐
 │  User's machine / CI / agent │  ───────────────────────────────────▶  │  EternalEngine API    │
 │  sandbox                     │                                        │  (app.eternalengineos │
 │  ┌─────────────────────────┐ │  ◀───────────────────────────────────  │  .io)                 │
 │  │ ee-mcp-public (stdio)   │ │        JSON responses only              └──────────────────────┘
 │  └─────────────────────────┘ │
 │  ┌─────────────────────────┐ │
 │  │ MCP client (Claude, …)  │ │  stdio, local IPC only — never crosses the network
 │  └─────────────────────────┘ │
 └─────────────────────────────┘
```

EternalEngine's infrastructure is **outside** this package's trust boundary in the sense that
matters: EternalEngine never runs this code, never sees the AI agent's reasoning or the MCP
client's other tool calls, and cannot distinguish a request from this package from a request made
with `curl` and the same key. Conversely, this package trusts EternalEngine's TLS certificate and
whatever `EE_API_BASE` points at — same trust a browser gives any HTTPS endpoint.

## What this server CANNOT do (by construction, not by policy)

- **Cannot write, modify, or delete anything.** Every tool is generated from a `GET` operation in
  the public spec (`scripts/codegen.mjs` `deriveTools()` reads only `paths[path].get`). There is
  no code path anywhere in `src/` that constructs a request body or uses any HTTP method other than
  `GET` — `src/client.ts`'s `getJson()` hard-codes `method: 'GET'`, and `src/tools.ts`'s
  `runTool()` never reads a `method` field off the tool it is given (see the SECURITY INVARIANT
  comment at the top of that file). Even a corrupted or hand-edited `generated-tools.ts` could not
  turn a tool into a write, short of editing `client.ts` itself.
- **Cannot bypass the caller's own authorization.** Every request carries exactly the key the user
  supplied. There is no fallback credential, no service account, no "if the key fails, try X" path.
  A revoked or expired key fails with a 401, surfaced as a tool error — nothing is retried with
  different credentials.
- **Cannot read local files, invoke a shell, or reach any host other than `EE_API_BASE`.** This
  package has no dependency that grants those capabilities (`@modelcontextprotocol/sdk` for the
  protocol, `zod` for validation — no `child_process`, no `fs` read of user data, no dynamic
  `require`/`import` of untrusted input).
- **Cannot see or exfiltrate the MCP client's other tools, prompts, or conversation context.**
  MCP servers only see the tool calls routed to them; this one has no mechanism to request more.
- **Cannot escalate a `read`-scoped key into a write.** The underlying services' own `apiKeyAuth`
  middleware (`services/ee-postframe/src/middleware/api-key-auth.ts`,
  `services/ee-paygate/src/middleware/api-key-auth.ts`) enforces scope server-side; this package
  never attempts a write regardless of what scope a key carries.

## What a leaked `EE_API_KEY` CAN do

This is the honest bound, stated plainly rather than implied by "read-only": if the key itself
leaks (e.g. committed to a public repo, pasted into a shared chat), the holder can do **anything
the key's own scope allows at the EternalEngine API** — which today, for a default `read`+`write`
PostFrame or PayGate key, includes writes, **because this package's read-only guarantee is a
property of this package, not of the key**. A leaked key used directly against the API (bypassing
this package entirely) is not constrained by anything documented here.

**Mitigations, in the user's control, not this package's:**
- Create a **narrower-scoped key** where the issuing service supports it (see each service's
  `CONTRACT.md` for its scope model).
- **Rotate/revoke** a key immediately if it leaks — both services' key-management endpoints
  support this (`POST .../api-keys/:id/roll`, `DELETE .../api-keys/:id`).
- Prefer `pf_test_*` / `pg_test_*` (test-mode) keys for any AI agent workflow that does not need
  live production data.

This package narrows the BLAST RADIUS of a key used *through it* (no write is ever attempted,
regardless of scope) but does not and cannot narrow the blast radius of the key itself once it
exists. Treat the key with the same care as a password.

## Rate limiting — defense in depth, not the authority

- **Client-side** (`src/rate-limiter.ts`): a per-tool sliding window matching the documented
  `x-rate-limit`. Purpose: fail fast locally, be a good citizen on bursty agent usage. This is
  advisory and lives in a process the user fully controls — it is not a security boundary.
- **Server-side** (EternalEngine's gateway `standardLimiter` + each service's own limits): the
  actual authority. A `429` from the server is surfaced as a tool error with the `Retry-After`
  value; this package never retries automatically or attempts to route around it.

## Dependencies (supply-chain surface)

| Package | Why | Trust basis |
|---|---|---|
| `@modelcontextprotocol/sdk` | The MCP protocol implementation | Official Anthropic SDK; version pinned to match the version already vetted for `services/ee-mcp` in this monorepo. |
| `zod` | Input validation (E03) | Widely-used, already a dependency across this monorepo's services. |

No other runtime dependency. `js-yaml` and `typescript`/`vitest` are dev-only (codegen and test
tooling), never shipped in `dist/`.

## Reporting an issue

Found a way for this package to do something this document says it cannot? That is a real
finding — open an issue in the [EternalEngineOS/.github](https://github.com/EternalEngineOS/.github/issues)
repository, or email `info@eternalengineos.io` (the one address EternalEngine publishes for
every inbound purpose, including security — see
[`SECURITY.md`](https://github.com/EternalEngineOS/.github/blob/main/SECURITY.md)).
