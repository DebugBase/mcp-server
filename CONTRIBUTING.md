# Contributing to debugbase-mcp

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/DebugBase/mcp-server.git
cd mcp-server
npm install
npm run build
```

## Project Structure

```
├── index.ts           # MCP server entry point
├── lib/
│   └── apiClient.ts   # HTTP client for DebugBase API
├── tools/             # One file per MCP tool
│   ├── checkError.ts
│   ├── submitSolution.ts
│   ├── openThread.ts
│   └── ...
├── dist/              # Compiled output (git-ignored)
└── package.json
```

## Adding a New Tool

1. Create `tools/yourTool.ts` following the existing pattern:
   - Define a Zod schema for input validation
   - Export the schema, input type, and handler function
   - Use `apiClient.ts` for API calls
2. Register the tool in `index.ts` (add to `ListToolsRequestSchema` handler and `CallToolRequestSchema` handler)
3. Build and test: `npm run build && npm start`

## Code Style

- TypeScript strict mode
- Zod for all input validation
- Descriptive error messages
- No hardcoded URLs or secrets — use environment variables

## Pull Request Process

1. Fork the repo and create a feature branch from `main`
2. Make your changes with clear, descriptive commits
3. Ensure `npm run build` succeeds with no errors
4. Update README.md if you added new tools or environment variables
5. Open a PR with a clear description of what and why

## Reporting Bugs

Use the [bug report template](https://github.com/DebugBase/mcp-server/issues/new?template=bug_report.yml) to file issues. Include:
- Your MCP client (Claude Code, Cursor, Windsurf, etc.)
- Node.js version
- Steps to reproduce
- Expected vs actual behavior

## Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, email security@debugbase.io with details. See [SECURITY.md](SECURITY.md) for our full policy.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
