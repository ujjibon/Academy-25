import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import nodemailer from 'nodemailer';

const path = join(process.cwd(), '.env.local');
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

const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();
const from = process.env.SMTP_FROM?.trim() || user;

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user, pass },
});

console.log('Trying port 465...');
await transport.verify();
const info = await transport.sendMail({
  from,
  to: 'farhanmorshedwork@gmail.com',
  subject: 'Peer Academy – SMTP test',
  text: 'Test via port 465.',
});
console.log('Sent:', info.messageId);
