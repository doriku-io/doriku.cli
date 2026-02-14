import { success, error } from './ui.mjs';

export async function testConnection(apiUrl, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await res.json();
      success(`Connected as: ${data.email || data.name || 'authenticated user'}`);
      return true;
    }

    error(`Connection failed: HTTP ${res.status}`);
    return false;
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Connection timed out (10s)' : err.message;
    error(`Connection failed: ${msg}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
