#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runSetup } from './setup.mjs';
import { error, log } from './ui.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const USAGE = `
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
  --help, -h         Show this help message
  --version, -v      Show version
`;

function main() {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        token: { type: 'string' },
        yes: { type: 'boolean', short: 'y', default: false },
        'skip-hooks': { type: 'boolean', default: false },
        'skip-test': { type: 'boolean', default: false },
        dir: { type: 'string', short: 'd' },
        'api-url': { type: 'string' },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    });
  } catch (err) {
    error(err.message);
    log(USAGE);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    log(USAGE);
    process.exit(0);
  }

  if (values.version) {
    log(pkg.version);
    process.exit(0);
  }

  const command = positionals[0];

  if (!command || command === 'setup') {
    runSetup({
      token: values.token,
      yes: values.yes,
      skipHooks: values['skip-hooks'],
      skipTest: values['skip-test'],
      dir: values.dir,
      apiUrl: values['api-url'],
    }).catch((err) => {
      error(err.message);
      process.exit(1);
    });
  } else {
    error(`Unknown command: ${command}`);
    log(USAGE);
    process.exit(1);
  }
}

main();
