# Changelog

All notable changes to ee-mcp-public are documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]
- Publishing to npm is in progress. Until then, install from source — see README.md.

## [0.1.0] - 2026-09-15

### Added
- **feat(ee-mcp-public)**: initial package. A read-only, stdio-only MCP server, generated at
  build time from the public OpenAPI spec published at
  [EternalEngineOS/openapi](https://github.com/EternalEngineOS/openapi). 43 tools, one per public
  GET operation across PostFrame and PayGate. Zero write tools, zero local file/shell access, Zod
  validation on every input, bounded fetches (`AbortSignal.timeout`), client-side rate limiting
  matching each tool's documented gateway limit. `private: false` + `publishConfig` set, ready to
  publish. 56 tests, all mocked (zero live network calls).
