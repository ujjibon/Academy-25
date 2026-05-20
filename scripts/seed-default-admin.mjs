/**
 * Creates the default Peer Academy admin in Firebase Auth (one-time / dev).
 *
 * Login in the app (admin sign-in page):
 *   Username: admin
 *   Password: Peer@2026
 *
 * Uses the same public Web API key as the client (see src/lib/firebase.ts).
 * Run: npm run seed:admin
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) return;
  const text = readFileSync(p, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

// Fallback: must match src/lib/firebase.ts when env is not set
const API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAGubLjD_cXaiPjYHQ6ooYY0JtZYB73mcQ';

const EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@peeracademy.com').trim().toLowerCase();
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Peer@2026';
const DISPLAY_NAME = process.env.SEED_ADMIN_DISPLAY_NAME || 'Admin';

async function postJson(path, body) {
  const url = `https://identitytoolkit.googleapis.com/v1/${path}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function main() {
  console.log('Seeding Firebase Auth admin:', EMAIL);

  let { ok, data } = await postJson('accounts:signUp', {
    email: EMAIL,
    password: PASSWORD,
    returnSecureToken: true,
  });

  if (!ok && data.error?.message === 'EMAIL_EXISTS') {
    console.log('Account already exists; verifying password…');
    const signIn = await postJson('accounts:signInWithPassword', {
      email: EMAIL,
      password: PASSWORD,
      returnSecureToken: true,
    });
    if (!signIn.ok) {
      console.error('Sign-in failed:', signIn.data.error?.message || signIn.data);
      process.exit(1);
    }
    data = signIn.data;
    ok = true;
    console.log('Password OK. Updating display name if needed…');
  }

  if (!ok) {
    console.error('Sign-up failed:', data.error?.message || data);
    process.exit(1);
  }

  const idToken = data.idToken;
  if (idToken) {
    const upd = await postJson('accounts:update', {
      idToken,
      displayName: DISPLAY_NAME,
      returnSecureToken: true,
    });
    if (!upd.ok) {
      console.warn('Could not set displayName:', upd.data.error?.message || upd.data);
    }
  }

  console.log('Done. Sign in at: https://localhost:3000/admin/login (or your deployed URL)');
  console.log('  Username: admin');
  console.log('  Password:', PASSWORD);
  console.log('');
  console.log('Ensure .env.local includes:');
  console.log('  ADMIN_EMAILS=' + EMAIL);
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
