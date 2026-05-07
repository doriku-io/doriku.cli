<div align="center">

# @doriku/cli

**The CLI for [Doriku](https://doriku.io) — an MCP-native governance plane for multi-IDE coding agents. Set up MCP config and Claude Code hooks, then manage workflows, file-lock policies, and cost caps from the terminal.**

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
| **Workflow Management** | List, run, monitor, and cancel multi-step agent workflows |
| **Lock Policies** | Define and inspect file-lock policies to prevent agent conflicts |
| **Cost Caps** | View and set workspace-level daily token spend limits |

Doriku also exposes AI-friendly MCP/REST contracts (structured MCP errors, machine-readable REST error fields, and a core OpenAPI spec) to make agent retries and recovery easier.

## Who This Is For

- Solo developers and teams using Claude Code, Cursor, or Windsurf in parallel
- Anyone who needs governance (file locks, cost caps, audit trails) across multi-IDE agents
- Teams that need approvals, auditability, and operational visibility across agent work

## CLI Reference

```
Usage: doriku <command> [options]

Commands:
  setup                     Configure MCP and Claude Code hooks
  workflow <subcommand>     Manage workflow definitions and runs
  lock <subcommand>         Manage file-lock policies
  cost <subcommand>         Manage workspace cost caps

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

### Workflow Subcommands

```bash
doriku workflow list                 # List all workflow definitions
doriku workflow run <slug>           # Start a workflow run
doriku workflow status <runId>       # Show run status and step summary
doriku workflow logs <runId>         # Show step-level timeline
doriku workflow cancel <runId>       # Cancel an in-progress run
```

### Lock Subcommands

```bash
doriku lock list                     # List all file-lock policies
doriku lock policy                   # Define a new policy (interactive)
```

### Cost Subcommands

```bash
doriku cost status                   # Show current cost cap config and today's usage
doriku cost set                      # Set daily token cap (interactive)
```

## Links

- [Website](https://doriku.io)
- [Documentation](https://doriku.io/docs)
- [Console](https://doriku.io/console)

## License

MIT
