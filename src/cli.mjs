#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runSetup } from './setup.mjs';
import { error, log } from './ui.mjs';
import { readLocalConfig, createClient } from './api.mjs';
import { runWorkflow, workflowUsage } from './commands/workflow.mjs';
import { runLock, lockUsage } from './commands/lock.mjs';
import { runCost, costUsage } from './commands/cost.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const USAGE = `
Usage: doriku <command> [options]

Commands:
  setup                     Configure MCP and Claude Code hooks
  workflow <subcommand>     Manage workflow definitions and runs
  lock <subcommand>         Manage file-lock policies
  cost <subcommand>         Manage workspace cost caps

Options:
  --token <key>      API key (drk_live_...) — defaults to .mcp.json in cwd
  --api-url <url>    API base URL (default: https://api.doriku.io)
  --yes, -y          Non-interactive mode (setup only)
  --skip-hooks       Skip Claude Code hook installation (setup only)
  --skip-test        Skip connection test (setup only)
  -d, --dir <path>   Target directory for .mcp.json (setup only)
  --help, -h         Show this help message
  --version, -v      Show version

Run 'doriku <command> --help' for subcommand usage.
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
    const command = positionals[0];
    if (command === 'workflow') { log(workflowUsage()); process.exit(0); }
    if (command === 'lock')     { log(lockUsage());     process.exit(0); }
    if (command === 'cost')     { log(costUsage());     process.exit(0); }
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
    return;
  }

  // Commands that require API access
  if (command === 'workflow' || command === 'lock' || command === 'cost') {
    const localCfg = readLocalConfig(values.dir || process.cwd());
    const token = values.token || localCfg?.token;
    const apiUrl = values['api-url'] || localCfg?.apiUrl;

    if (!token) {
      error('No API token found. Run `doriku setup` first, or pass --token <key>.');
      process.exit(1);
    }

    const client = createClient({ token, apiUrl });
    const subcommand = positionals[1];

    if (!subcommand) {
      if (command === 'workflow') log(workflowUsage());
      else if (command === 'lock') log(lockUsage());
      else if (command === 'cost') log(costUsage());
      process.exit(0);
    }

    const args = positionals.slice(2);

    let runner;
    if (command === 'workflow') runner = runWorkflow(subcommand, args, client);
    else if (command === 'lock') runner = runLock(subcommand, args, client);
    else runner = runCost(subcommand, args, client);

    runner.catch((err) => {
      error(err.message || String(err));
      process.exit(1);
    });
    return;
  }

  error(`Unknown command: ${command}`);
  log(USAGE);
  process.exit(1);
}

main();
