export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo?: string;
};

function envValue(key: string): string | undefined {
  const raw = process.env[key]?.trim();
  if (!raw) return undefined;
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

export function getSmtpConfig(): SmtpConfig | null {
  const user = envValue('SMTP_USER');
  const pass = envValue('SMTP_PASS')?.replace(/\s+/g, '');
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || '587');
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465;

  return {
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port,
    secure,
    user,
    pass,
    from: envValue('SMTP_FROM') || user,
    replyTo: envValue('SMTP_REPLY_TO') || undefined,
  };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export function getBulkMailLimits() {
  return {
    maxRecipients: Math.max(
      1,
      Number(process.env.BULK_MAIL_MAX_RECIPIENTS || '200')
    ),
    delayMs: Math.max(
      0,
      Number(process.env.BULK_MAIL_DELAY_MS || '300')
    ),
  };
}
