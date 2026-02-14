import * as fs from 'node:fs';
import * as path from 'node:path';
import { success, warn, info } from './ui.mjs';

export function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    if (err instanceof SyntaxError) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      warn(`Invalid JSON in ${filePath}. Backed up to ${backupPath}`);
      return null;
    }
    throw err;
  }
}

export function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function mergeMcpConfig(targetPath, apiUrl, token) {
  const existing = readJsonFile(targetPath) || {};
  if (!existing.mcpServers) {
    existing.mcpServers = {};
  }

  existing.mcpServers.doriku = {
    url: `${apiUrl}/mcp`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  writeJsonFile(targetPath, existing);
  success(`MCP config written to ${targetPath}`);
  info(`Other servers preserved: ${Object.keys(existing.mcpServers).filter(k => k !== 'doriku').join(', ') || '(none)'}`);

  const dir = path.dirname(targetPath);
  const gitignorePath = path.join(dir, '.gitignore');
  try {
    const gitDir = path.join(dir, '.git');
    if (fs.existsSync(gitDir)) {
      const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
      if (!gitignore.includes('.mcp.json')) {
        warn('Add .mcp.json to your .gitignore to prevent committing your API token');
      }
    }
  } catch {}
}
