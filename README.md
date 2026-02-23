<div align="center">

# @doriku/cli

**Set up [Doriku](https://doriku.io) MCP configuration and Claude Code hooks in one command. Doriku is an agent coordination and execution control plane for AI-native dev teams.**

[![npm version](https://img.shields.io/npm/v/@doriku/cli.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/@doriku/cli)
[![license](https://img.shields.io/npm/l/@doriku/cli.svg?style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/@doriku/cli.svg?style=flat-square)](package.json)

</div>

---

## Quick Start

```bash
npx @doriku/cli setup
```

That's it. Your MCP server config and Claude Code hooks are ready.

Recommended next workflow (AI-friendly):
1. Register your agent
2. Create a task
3. Log progress
4. Update task status/result

Recommended first-value goal (15 minutes):
1. Connect MCP successfully (connection test passes)
2. Create one real engineering task
3. Generate one summary snapshot
4. Invite one teammate to review the shared state

See docs for MCP/API contracts, first-value onboarding, and recipe examples:
- [Documentation home](https://doriku.io/docs)
- [15-minute first value playbook](https://doriku.io/docs#first-value-loop)
- [Use case recipes](https://doriku.io/docs#use-cases)

## Installation

```bash
# Run directly (no install needed)
npx @doriku/cli setup

# Or install globally
npm install -g @doriku/cli
doriku setup
```

## Setup Flow

1. Sign in at [doriku.io/console](https://doriku.io/console/login) and create an API key
2. Run the setup command
3. Enter your API key when prompted — done!

### Non-Interactive Mode

```bash
npx @doriku/cli setup --token drk_live_your_key_here --yes
```

## What It Does

| Step | Description |
|------|-------------|
| **MCP Configuration** | Writes `.mcp.json` with your Doriku server config (merges with existing servers) |
| **Claude Code Hooks** | Installs hooks in `~/.claude/settings.json` for automatic task sync |
| **Connection Test** | Verifies your API key works against the Doriku API |

Doriku also exposes AI-friendly MCP/REST contracts (structured MCP errors, machine-readable REST error fields, and a core OpenAPI spec) to make agent retries and recovery easier.

## Who This Is For

- AI-native dev teams (2-20) using Claude Code, Cursor, or API agents in parallel
- Teams that need approvals, auditability, and operational visibility across agent work
- Teams outgrowing spreadsheets / Notion / Slack for agent coordination

## CLI Reference

```
Usage: doriku <command> [options]

Commands:
  setup    Configure MCP and Claude Code hooks

Options:
  --token <key>      API key (drk_live_...)
  --yes, -y          Non-interactive mode (accept all defaults)
  --skip-hooks       Skip Claude Code hook installation
  --skip-test        Skip connection test
  -d, --dir <path>   Target directory for .mcp.json (default: cwd)
  --api-url <url>    API base URL (default: https://api.doriku.io)
  --help, -h         Show help
  --version, -v      Show version
```

## Links

- [Website](https://doriku.io)
- [Documentation](https://doriku.io/docs)
- [Console](https://doriku.io/console)

## License

MIT
