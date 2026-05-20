import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import nodemailer from 'nodemailer';

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
const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();
const port = Number(process.env.SMTP_PORT || '587');
const secure = process.env.SMTP_SECURE === 'true' || port === 465;
const from = process.env.SMTP_FROM?.trim() || user;
const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';

if (!user || !pass) {
  console.error('SMTP_USER and SMTP_PASS required in .env.local');
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

const to = 'farhanmorshedwork@gmail.com';

console.log('Verifying SMTP...');
await transport.verify();
console.log('Sending test to', to);

const info = await transport.sendMail({
  from,
  to,
  subject: 'Peer Academy – SMTP test',
  text: 'Hello Farhan,\n\nThis is a test email from your Peer Academy bulk notification system.',
  html: '<p>Hello Farhan,</p><p>This is a test email from your Peer Academy bulk notification system.</p>',
});

console.log('Sent:', info.messageId);
console.log('Response:', info.response);
