import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnvLocal() {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const user = process.env.SMTP_USER?.trim();
const passRaw = process.env.SMTP_PASS ?? '';
const pass = passRaw.replace(/\s+/g, '');

console.log({
  SMTP_USER: user,
  passLength: pass.length,
  passHasSpaces: /\s/.test(passRaw),
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_FROM_set: Boolean(process.env.SMTP_FROM),
});
