/**
 * Peer Academy / Peer Portal branded HTML email templates.
 * Inline styles only — compatible with Gmail, Outlook, and mobile clients.
 */

export const PEER_EMAIL_BRAND = {
  midnight: '#000B58',
  midnightLight: '#1A2258',
  royal: '#00139E',
  royalLight: '#1D2FB5',
  flare: '#FF1414',
  flareLight: '#FF6262',
  chalk: '#FFFFFF',
  chalkSoft: '#E6E8F1',
  slate: '#A2B5CB',
  slateDark: '#6C829D',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export type EmailTemplateId =
  | 'announcement'
  | 'course_launch'
  | 'achievement'
  | 'learning_reminder';

export type EmailTemplatePreset = {
  id: EmailTemplateId;
  label: string;
  description: string;
  defaultSubject: string;
  defaultHook: string;
  defaultPreheader: string;
  badge: string;
  badgeColor: string;
  stats: { label: string; value: string; icon: string }[];
  defaultCtaLabel: string;
};

export const EMAIL_TEMPLATE_PRESETS: Record<EmailTemplateId, EmailTemplatePreset> = {
  announcement: {
    id: 'announcement',
    label: 'Announcement',
    description: 'Platform news, policy, or general updates',
    defaultSubject: 'Something new is live on Peer Academy',
    defaultHook: 'Your learning dashboard just got an upgrade',
    defaultPreheader: 'See what is new on your Peer Academy dashboard',
    badge: 'Platform update',
    badgeColor: PEER_EMAIL_BRAND.royal,
    stats: [
      { label: 'Your portal', value: 'Active', icon: '◆' },
      { label: 'Courses', value: 'Open', icon: '▣' },
      { label: 'Community', value: 'Live', icon: '◎' },
    ],
    defaultCtaLabel: 'Open your dashboard',
  },
  course_launch: {
    id: 'course_launch',
    label: 'New course',
    description: 'Launch or spotlight a new learning path',
    defaultSubject: 'A new course is ready for you',
    defaultHook: 'Your next skill sprint starts now',
    defaultPreheader: 'Enroll in the latest course on Peer Academy',
    badge: 'New course',
    badgeColor: PEER_EMAIL_BRAND.royalLight,
    stats: [
      { label: 'Format', value: 'Self-paced', icon: '▶' },
      { label: 'Mode', value: 'Interactive', icon: '✦' },
      { label: 'XP', value: 'Earnable', icon: '★' },
    ],
    defaultCtaLabel: 'Start learning',
  },
  achievement: {
    id: 'achievement',
    label: 'Achievement',
    description: 'Certificates, milestones, or streak wins',
    defaultSubject: 'You unlocked a new milestone',
    defaultHook: 'Your progress deserves a spotlight',
    defaultPreheader: 'Celebrate your latest Peer Academy achievement',
    badge: 'Milestone',
    badgeColor: PEER_EMAIL_BRAND.flare,
    stats: [
      { label: 'Progress', value: 'Tracked', icon: '↑' },
      { label: 'Streak', value: 'Growing', icon: '🔥' },
      { label: 'Rank', value: 'Climbing', icon: '◈' },
    ],
    defaultCtaLabel: 'View your progress',
  },
  learning_reminder: {
    id: 'learning_reminder',
    label: 'Learning reminder',
    description: 'Nudge learners back to the classroom',
    defaultSubject: 'Pick up where you left off',
    defaultHook: 'Five minutes today beats zero tomorrow',
    defaultPreheader: 'Your classroom is waiting on Peer Academy',
    badge: 'Reminder',
    badgeColor: PEER_EMAIL_BRAND.slateDark,
    stats: [
      { label: 'Classroom', value: 'Ready', icon: '◇' },
      { label: 'Lessons', value: 'Waiting', icon: '☰' },
      { label: 'Tutor', value: 'Online', icon: '◉' },
    ],
    defaultCtaLabel: 'Continue learning',
  },
};

export type BuildPeerEmailInput = {
  templateId: EmailTemplateId;
  hook: string;
  preheader?: string;
  bodyParagraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  recipientName?: string;
  recipientEmail?: string;
};

export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!url) return 'http://localhost:3000';
  if (url.startsWith('http')) return url.replace(/\/$/, '');
  return `https://${url.replace(/\/$/, '')}`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function plainMessageToParagraphs(message: string): string[] {
  return message
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function paragraphsToBodyHtml(paragraphs: string[]): string {
  if (paragraphs.length === 0) {
    return `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${PEER_EMAIL_BRAND.slateDark};">We have an update for you on Peer Academy.</p>`;
  }
  return paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${PEER_EMAIL_BRAND.slateDark};">${escapeHtml(p)}</p>`
    )
    .join('');
}

function personalizeTokens(
  text: string,
  name: string,
  email: string
): string {
  return text.replaceAll('{{name}}', name).replaceAll('{{email}}', email);
}

function statCardsHtml(
  stats: EmailTemplatePreset['stats']
): string {
  const cells = stats
    .map(
      (s) => `
      <td width="33.33%" style="padding:0 6px;vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PEER_EMAIL_BRAND.chalk};border:1px solid ${PEER_EMAIL_BRAND.chalkSoft};border-radius:16px;">
          <tr>
            <td style="padding:14px 12px;text-align:center;">
              <div style="font-size:18px;line-height:1;margin-bottom:6px;color:${PEER_EMAIL_BRAND.royal};">${s.icon}</div>
              <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${PEER_EMAIL_BRAND.slate};margin-bottom:4px;">${escapeHtml(s.label)}</div>
              <div style="font-size:15px;font-weight:700;color:${PEER_EMAIL_BRAND.midnight};">${escapeHtml(s.value)}</div>
            </td>
          </tr>
        </table>
      </td>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>${cells}</tr>
    </table>`;
}

export function buildPeerAcademyEmail(input: BuildPeerEmailInput): {
  html: string;
  text: string;
} {
  const preset = EMAIL_TEMPLATE_PRESETS[input.templateId];
  const baseUrl = getAppBaseUrl();
  const name =
    input.recipientName?.trim() ||
    input.recipientEmail?.split('@')[0] ||
    'Learner';
  const email = input.recipientEmail?.trim() || '';

  const hook = personalizeTokens(input.hook.trim() || preset.defaultHook, name, email);
  const preheader = personalizeTokens(
    input.preheader?.trim() || preset.defaultPreheader,
    name,
    email
  );
  const ctaLabel = input.ctaLabel?.trim() || preset.defaultCtaLabel;
  const ctaUrl = input.ctaUrl?.trim() || `${baseUrl}/dashboard`;
  const bodyHtml = paragraphsToBodyHtml(input.bodyParagraphs);
  const b = PEER_EMAIL_BRAND;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(hook)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${b.chalkSoft};font-family:${b.fontFamily};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${b.chalkSoft};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="border-radius:24px 24px 0 0;overflow:hidden;background:linear-gradient(135deg, ${b.midnight} 0%, ${b.royal} 55%, ${b.royalLight} 100%);padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <div style="width:44px;height:44px;border-radius:50%;background:${b.midnight};border:2px solid rgba(255,255,255,0.2);text-align:center;line-height:44px;font-size:18px;font-weight:800;color:#fff;">P</div>
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1.2;">Peer Academy</div>
                          <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;letter-spacing:0.04em;text-transform:uppercase;">Learn · Level up · Lead</div>
                        </td>
                        <td align="right" style="vertical-align:top;">
                          <span style="display:inline-block;background:${preset.badgeColor};color:#fff;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;">${escapeHtml(preset.badge)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg, ${b.flare} 0%, ${b.flareLight} 50%, ${b.royalLight} 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:${b.chalk};border-left:1px solid ${b.chalkSoft};border-right:1px solid ${b.chalkSoft};padding:32px 32px 8px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${b.royal};letter-spacing:0.02em;">Hi ${escapeHtml(name)},</p>
              <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;line-height:1.2;color:${b.midnight};letter-spacing:-0.03em;">${escapeHtml(hook)}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:${b.slate};">${escapeHtml(preset.description)}</p>
              ${statCardsHtml(preset.stats)}
              <div style="background:${b.chalkSoft};border-radius:20px;padding:24px 22px;margin-bottom:24px;">
                ${bodyHtml}
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:999px;background:${b.royal};">
                    <a href="${escapeHtml(ctaUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.01em;">${escapeHtml(ctaLabel)} →</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <a href="${escapeHtml(baseUrl)}/dashboard" style="font-size:13px;font-weight:600;color:${b.royal};text-decoration:none;margin:0 12px;">Dashboard</a>
                    <span style="color:${b.slate};">|</span>
                    <a href="${escapeHtml(baseUrl)}/classroom" style="font-size:13px;font-weight:600;color:${b.royal};text-decoration:none;margin:0 12px;">Classroom</a>
                    <span style="color:${b.slate};">|</span>
                    <a href="${escapeHtml(baseUrl)}/leaderboard" style="font-size:13px;font-weight:600;color:${b.royal};text-decoration:none;margin:0 12px;">Leaderboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${b.midnight};border-radius:0 0 24px 24px;padding:24px 32px;text-align:center;border:1px solid ${b.midnightLight};">
              <p style="margin:0 0 8px;font-size:13px;color:${b.slate};line-height:1.5;">
                Sent by <strong style="color:#fff;">Peer Academy</strong> · Peer Portal learning platform
              </p>
              <p style="margin:0;font-size:11px;color:${b.slateDark};line-height:1.5;">
                You are receiving this because you have an account on Peer Academy.<br />
                <a href="${escapeHtml(baseUrl)}/dashboard" style="color:${b.slate};text-decoration:underline;">Manage your learning</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const plainParagraphs = input.bodyParagraphs.length
    ? input.bodyParagraphs.map((p) => personalizeTokens(p, name, email))
    : ['We have an update for you on Peer Academy.'];

  const text = [
    `Peer Academy — ${preset.badge}`,
    '',
    `Hi ${name},`,
    '',
    hook,
    '',
    ...plainParagraphs,
    '',
    `${ctaLabel}: ${ctaUrl}`,
    '',
    `Dashboard: ${baseUrl}/dashboard`,
    `Classroom: ${baseUrl}/classroom`,
    `Leaderboard: ${baseUrl}/leaderboard`,
    '',
    '— Peer Academy / Peer Portal',
  ].join('\n');

  return { html, text };
}

export function buildBrandedBulkPayload(
  input: {
    templateId: EmailTemplateId;
    subject: string;
    hook: string;
    preheader?: string;
    message: string;
    ctaLabel?: string;
    ctaUrl?: string;
  },
  recipient: { email: string; name?: string }
): { html: string; text: string } {
  return buildPeerAcademyEmail({
    templateId: input.templateId,
    hook: input.hook,
    preheader: input.preheader,
    bodyParagraphs: plainMessageToParagraphs(input.message),
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
  });
}
