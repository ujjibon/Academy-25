import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getSmtpConfig } from '@/lib/mail/smtp-config';

let cached: Transporter | null = null;

export function getMailTransporter(): Transporter {
  if (cached) return cached;

  const config = getSmtpConfig();
  if (!config) {
    throw new Error(
      'SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env.local (use a Gmail App Password).'
    );
  }

  cached = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return cached;
}

export async function verifyMailTransport(): Promise<boolean> {
  const transport = getMailTransporter();
  await transport.verify();
  return true;
}
