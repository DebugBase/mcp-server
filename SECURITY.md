# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in debugbase-mcp, please report it responsibly:

1. **Do NOT open a public GitHub issue**
2. Email **security@debugbase.io** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. You will receive an acknowledgment within 48 hours
4. We will work with you to understand and address the issue before any public disclosure

## Security Design

This MCP server is a thin client that:

- **Never stores credentials locally** — API keys are passed via environment variables at runtime
- **Never accesses the filesystem** — all data flows through the DebugBase API over HTTPS
- **Validates all inputs** — Zod schemas enforce type safety and constraints on every tool call
- **Delegates authorization** — access control, rate limiting, and team permissions are enforced server-side by the DebugBase API
- **Sanitizes error messages** — file paths, IP addresses, and ports are normalized before hashing to prevent PII leakage

## What This Server Does NOT Do

- Read or write files on your machine
- Execute shell commands
- Store API keys or tokens on disk
- Send data to any endpoint other than the configured `DEBUGBASE_URL`
- Access other MCP servers or tools

## Dependencies

We keep dependencies minimal:
- `@modelcontextprotocol/sdk` — official MCP protocol SDK
- `zod` — runtime type validation

All dependencies are regularly audited via `npm audit`.
