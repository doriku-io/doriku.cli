# @doriku/cli

Set up [Doriku](https://doriku.io) MCP configuration and Claude Code hooks in one command.

## Installation

```bash
npx @doriku/cli setup
```

Or install globally:

```bash
npm install -g @doriku/cli
doriku setup
```

## Quick Start

1. Sign in at [doriku.io/console](https://doriku.io/console/login) and create an API key
2. Run the setup command:

```bash
npx @doriku/cli setup
```

3. Enter your API key when prompted — done! Your AI tools can now sync via Doriku.

### Non-Interactive Mode

```bash
npx @doriku/cli setup --token drk_live_your_key_here --yes
```

## CLI Options

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

## What It Does

1. **MCP Configuration** — Writes `.mcp.json` with your Doriku server config (merges with existing servers)
2. **Claude Code Hooks** — Installs hooks in `~/.claude/settings.json` for automatic task sync
3. **Connection Test** — Verifies your API key works against the Doriku API

## Links

- [Website](https://doriku.io)
- [Documentation](https://doriku.io/docs)
- [Console](https://doriku.io/console)
- [Issues](https://github.com/Deiamor/doriku.cli/issues)

## License

MIT
