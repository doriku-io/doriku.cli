import * as path from 'node:path';
import { readJsonFile } from './config.mjs';

const DEFAULT_API_URL = 'https://api.doriku.io';
const TIMEOUT_MS = 15000;

/**
 * Read token and apiUrl from .mcp.json in the given directory.
 * Returns null if not configured.
 */
export function readLocalConfig(dir = process.cwd()) {
  const mcpPath = path.join(dir, '.mcp.json');
  const data = readJsonFile(mcpPath);
  if (!data?.mcpServers?.doriku) return null;
  const { url, headers } = data.mcpServers.doriku;
  const token = headers?.Authorization?.replace(/^Bearer\s+/i, '') || null;
  const apiUrl = url?.replace(/\/mcp$/, '') || DEFAULT_API_URL;
  return token ? { token, apiUrl } : null;
}

/**
 * Create a minimal API client bound to a token + baseUrl.
 */
export function createClient({ token, apiUrl = DEFAULT_API_URL }) {
  const base = `${apiUrl}/api/v1`;

  async function request(method, pathname, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const opts = {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      };
      if (body !== undefined) opts.body = JSON.stringify(body);
      const res = await fetch(`${base}${pathname}`, opts);
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { message: text }; }
      if (!res.ok) {
        const msg = json?.message || json?.error || `HTTP ${res.status}`;
        throw Object.assign(new Error(msg), { status: res.status, body: json });
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get:    (p)      => request('GET',    p),
    post:   (p, b)   => request('POST',   p, b),
    put:    (p, b)   => request('PUT',    p, b),
    patch:  (p, b)   => request('PATCH',  p, b),
    delete: (p)      => request('DELETE', p),
  };
}
