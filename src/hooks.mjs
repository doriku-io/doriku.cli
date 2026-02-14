import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readJsonFile, writeJsonFile } from './config.mjs';
import { success, info, warn } from './ui.mjs';

const HOOK_SCRIPT_NAME = 'sync-doriku.sh';
const HOOK_ENV_NAME = 'sync-doriku.env';
const MAPPINGS_DIR_NAME = 'doriku-mappings';

function getClaudeDir() {
  return path.join(os.homedir(), '.claude');
}

export function installHooks(apiUrl, token) {
  const claudeDir = getClaudeDir();
  const hooksDir = path.join(claudeDir, 'hooks');

  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const scriptSrc = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..',
    'assets',
    HOOK_SCRIPT_NAME,
  );
  const scriptDst = path.join(hooksDir, HOOK_SCRIPT_NAME);

  fs.copyFileSync(scriptSrc, scriptDst);
  fs.chmodSync(scriptDst, 0o755);
  success(`Hook script installed: ${scriptDst}`);

  const envPath = path.join(hooksDir, HOOK_ENV_NAME);
  const envContent = [
    `DORIKU_API_BASE="${apiUrl}/api/v1"`,
    `DORIKU_API_TOKEN="${token}"`,
    `DORIKU_MAPPING_DIR="$HOME/.claude/hooks/${MAPPINGS_DIR_NAME}"`,
    '',
  ].join('\n');
  fs.writeFileSync(envPath, envContent, 'utf-8');
  fs.chmodSync(envPath, 0o600);
  success(`Hook env written: ${envPath}`);

  const mappingsDir = path.join(hooksDir, MAPPINGS_DIR_NAME);
  if (!fs.existsSync(mappingsDir)) {
    fs.mkdirSync(mappingsDir, { recursive: true });
  }
  info(`Mappings directory: ${mappingsDir}`);

  mergeSettings(claudeDir, scriptDst);
}

function mergeSettings(claudeDir, scriptPath) {
  const settingsPath = path.join(claudeDir, 'settings.json');
  const settings = readJsonFile(settingsPath) || {};

  if (!settings.hooks) {
    settings.hooks = {};
  }

  const hookEntry = {
    type: 'command',
    command: scriptPath,
    matcher: 'TaskCreate|TaskUpdate',
  };

  const hookEvents = ['PostToolUse', 'TaskCompleted'];

  for (const event of hookEvents) {
    if (!Array.isArray(settings.hooks[event])) {
      settings.hooks[event] = [];
    }

    const alreadyExists = settings.hooks[event].some(
      (h) => typeof h === 'object' && h.command && h.command.includes(HOOK_SCRIPT_NAME),
    );

    if (!alreadyExists) {
      settings.hooks[event].push(hookEntry);
      success(`Hook added to settings.json: ${event}`);
    } else {
      info(`Hook already exists in settings.json: ${event} (skipped)`);
    }
  }

  writeJsonFile(settingsPath, settings);
  success(`Settings saved: ${settingsPath}`);
}
