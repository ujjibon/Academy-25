import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import {
  isSmtpConfigured,
  getBulkMailLimits,
} from '@/lib/mail/smtp-config';
import { verifyMailTransport } from '@/lib/mail/transporter';
import {
  normalizeRecipients,
  sendBulkMail,
  type BulkMailRecipient,
  type BrandedMailContent,
} from '@/lib/mail/bulk-mail';
import {
  EMAIL_TEMPLATE_PRESETS,
  type EmailTemplateId,
} from '@/lib/mail/email-template';

function parseRecipients(body: unknown): BulkMailRecipient[] {
  if (!Array.isArray(body)) return [];
  return body
    .map((item) => {
      if (typeof item === 'string') {
        return { email: item };
      }
      if (item && typeof item === 'object' && 'email' in item) {
        const row = item as { email?: unknown; name?: unknown };
        return {
          email: String(row.email || ''),
          name: row.name != null ? String(row.name) : undefined,
        };
      }
      return { email: '' };
    })
    .filter((r) => r.email);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configured = isSmtpConfigured();
  const limits = getBulkMailLimits();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      verified: false,
      limits,
    });
  }

  try {
    await verifyMailTransport();
    return NextResponse.json({
      configured: true,
      verified: true,
      limits,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      verified: false,
      limits,
      verifyError:
        error instanceof Error ? error.message : 'SMTP verification failed',
    });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      {
        error:
          'SMTP is not configured. Add SMTP_USER and SMTP_PASS to .env.local.',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const subject = String(body?.subject || '').trim();
    const html = body?.html != null ? String(body.html).trim() : undefined;
    const text = body?.text != null ? String(body.text).trim() : undefined;
    const useBranded = body?.branded === true;
    const rawRecipients = parseRecipients(body?.recipients);
    const recipients = normalizeRecipients(rawRecipients);

    let branded: BrandedMailContent | undefined;
    if (useBranded) {
      const templateId = String(body?.templateId || 'announcement') as EmailTemplateId;
      if (!EMAIL_TEMPLATE_PRESETS[templateId]) {
        return NextResponse.json({ error: 'Invalid templateId.' }, { status: 400 });
      }
      branded = {
        templateId,
        hook: String(body?.hook || '').trim(),
        preheader: body?.preheader != null ? String(body.preheader).trim() : undefined,
        message: String(body?.message || '').trim(),
        ctaLabel: body?.ctaLabel != null ? String(body.ctaLabel).trim() : undefined,
        ctaUrl: body?.ctaUrl != null ? String(body.ctaUrl).trim() : undefined,
      };
    }

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
    }
    if (!branded && !html && !text) {
      return NextResponse.json(
        { error: 'Message body (html, text, or branded template) is required.' },
        { status: 400 }
      );
    }
    if (branded && !branded.hook && !branded.message) {
      return NextResponse.json(
        { error: 'Branded email requires a hook and message.' },
        { status: 400 }
      );
    }
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid recipient is required.' },
        { status: 400 }
      );
    }

    const result = await sendBulkMail({
      subject,
      html: branded ? undefined : html || `<p>${text}</p>`,
      text: branded ? undefined : text,
      branded,
      recipients,
    });

    return NextResponse.json({
      success: result.failed === 0,
      ...result,
    });
  } catch (error) {
    console.error('Bulk mail API error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to send bulk mail.';
    const status = message.includes('Too many recipients') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
