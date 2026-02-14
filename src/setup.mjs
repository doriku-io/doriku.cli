import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mergeMcpConfig } from './config.mjs';
import { installHooks } from './hooks.mjs';
import { testConnection } from './test-connection.mjs';
import { header, step, prompt, confirm, success, warn, info } from './ui.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const DEFAULT_API_URL = 'https://api.doriku.io';
const TOTAL_STEPS = 4;

export async function runSetup(options) {
  header('Doriku CLI Setup');
  info(`v${pkg.version}\n`);

  let token = options.token || '';
  const apiUrl = options.apiUrl || DEFAULT_API_URL;
  const skipHooks = options.skipHooks || false;
  const skipTest = options.skipTest || false;
  const autoYes = options.yes || false;
  const targetDir = options.dir || process.cwd();

  step(1, TOTAL_STEPS, 'API Key');
  if (!token) {
    token = await prompt('Enter your Doriku API key (drk_live_...)');
    if (!token) {
      warn('No API key provided. Aborting.');
      process.exit(1);
    }
  } else {
    success(`Using provided token: ${token.slice(0, 9)}...${token.slice(-4)}`);
  }

  step(2, TOTAL_STEPS, 'MCP Configuration');
  const mcpPath = path.join(targetDir, '.mcp.json');
  if (!autoYes) {
    const ok = await confirm(`Write MCP config to ${mcpPath}?`);
    if (!ok) {
      warn('Skipping MCP config.');
    } else {
      mergeMcpConfig(mcpPath, apiUrl, token);
    }
  } else {
    mergeMcpConfig(mcpPath, apiUrl, token);
  }

  step(3, TOTAL_STEPS, 'Claude Code Hooks');
  if (skipHooks) {
    info('Skipping hook installation (--skip-hooks)');
  } else if (!autoYes) {
    const ok = await confirm('Install Claude Code hooks for auto-sync?');
    if (!ok) {
      info('Skipping hooks.');
    } else {
      installHooks(apiUrl, token);
    }
  } else {
    installHooks(apiUrl, token);
  }

  step(4, TOTAL_STEPS, 'Connection Test');
  if (skipTest) {
    info('Skipping connection test (--skip-test)');
  } else {
    const ok = await testConnection(apiUrl, token);
    if (!ok) {
      warn('Connection test failed. Setup completed but verify your API key.');
    }
  }

  console.log('');
  success('Setup complete!');
  info('Your agent can now connect to Doriku via MCP.');
  info('Documentation: https://doriku.io/docs');
}
