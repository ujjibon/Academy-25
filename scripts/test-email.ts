import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnvLocal() {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

async function main() {
  const { sendBulkMail } = await import('../src/lib/mail/bulk-mail');
  const { verifyMailTransport } = await import('../src/lib/mail/transporter');

  console.log('Verifying SMTP connection...');
  await verifyMailTransport();
  console.log('SMTP OK. Sending test email...');

  const result = await sendBulkMail({
    subject: 'Peer Academy – SMTP test',
    html: '<p>Hello {{name}},</p><p>This is a test email from your Peer Academy bulk notification system.</p>',
    text: 'Hello {{name}},\n\nThis is a test email from your Peer Academy bulk notification system.',
    recipients: [{ email: 'farhanmorshedwork@gmail.com', name: 'Farhan' }],
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
