import { getBulkMailLimits, getSmtpConfig } from '@/lib/mail/smtp-config';
import { getMailTransporter } from '@/lib/mail/transporter';
import {
  buildBrandedBulkPayload,
  type EmailTemplateId,
} from '@/lib/mail/email-template';

export type BulkMailRecipient = {
  email: string;
  name?: string;
};

export type BrandedMailContent = {
  templateId: EmailTemplateId;
  hook: string;
  preheader?: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type BulkMailPayload = {
  subject: string;
  html?: string;
  text?: string;
  recipients: BulkMailRecipient[];
  branded?: BrandedMailContent;
};

export type BulkMailSendFailure = {
  email: string;
  error: string;
};

export type BulkMailResult = {
  total: number;
  sent: number;
  failed: number;
  failures: BulkMailSendFailure[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeRecipients(
  recipients: BulkMailRecipient[]
): BulkMailRecipient[] {
  const seen = new Set<string>();
  const normalized: BulkMailRecipient[] = [];

  for (const entry of recipients) {
    const email = entry.email?.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    normalized.push({
      email,
      name: entry.name?.trim() || undefined,
    });
  }

  return normalized;
}

function personalize(template: string, recipient: BulkMailRecipient): string {
  const name = recipient.name || recipient.email.split('@')[0];
  return template
    .replaceAll('{{name}}', name)
    .replaceAll('{{email}}', recipient.email);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendBulkMail(
  payload: BulkMailPayload
): Promise<BulkMailResult> {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error('SMTP is not configured.');
  }

  const subject = payload.subject.trim();
  const htmlTemplate = payload.html?.trim();
  const textTemplate = payload.text?.trim();
  const branded = payload.branded;

  if (!subject) throw new Error('Subject is required.');
  if (!branded && !htmlTemplate && !textTemplate) {
    throw new Error('Message body (html, text, or branded template) is required.');
  }
  if (branded && !branded.message.trim() && !branded.hook.trim()) {
    throw new Error('Branded email requires a hook and message.');
  }

  const { maxRecipients, delayMs } = getBulkMailLimits();
  const recipients = normalizeRecipients(payload.recipients);

  if (recipients.length === 0) {
    throw new Error('At least one valid recipient email is required.');
  }
  if (recipients.length > maxRecipients) {
    throw new Error(
      `Too many recipients (${recipients.length}). Maximum is ${maxRecipients}.`
    );
  }

  const transport = getMailTransporter();
  const failures: BulkMailSendFailure[] = [];
  let sent = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    let html: string | undefined;
    let text: string | undefined;

    if (branded) {
      const built = buildBrandedBulkPayload(
        {
          templateId: branded.templateId,
          subject,
          hook: branded.hook,
          preheader: branded.preheader,
          message: branded.message,
          ctaLabel: branded.ctaLabel,
          ctaUrl: branded.ctaUrl,
        },
        recipient
      );
      html = built.html;
      text = built.text;
    } else {
      html = htmlTemplate ? personalize(htmlTemplate, recipient) : undefined;
      text = textTemplate
        ? personalize(textTemplate, recipient)
        : html
          ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          : undefined;
    }

    try {
      await transport.sendMail({
        from: config.from,
        to: recipient.email,
        replyTo: config.replyTo,
        subject,
        html: html || `<p>${text}</p>`,
        text,
      });
      sent++;
    } catch (err) {
      failures.push({
        email: recipient.email,
        error: err instanceof Error ? err.message : 'Send failed',
      });
    }

    if (delayMs > 0 && i < recipients.length - 1) {
      await delay(delayMs);
    }
  }

  return {
    total: recipients.length,
    sent,
    failed: failures.length,
    failures,
  };
}
