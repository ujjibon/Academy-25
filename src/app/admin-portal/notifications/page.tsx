'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllUsers, type UserProfile } from '@/lib/firebase';
import { adminFetch } from '@/lib/admin-fetch';
import { useToast } from '@/hooks/use-toast';
import {
  buildPeerAcademyEmail,
  EMAIL_TEMPLATE_PRESETS,
  getAppBaseUrl,
  type EmailTemplateId,
} from '@/lib/mail/email-template';
import { Loader2, Mail, Send, AlertCircle, CheckCircle2, Eye, Sparkles } from 'lucide-react';

type SmtpStatus = {
  configured: boolean;
  verified: boolean;
  verifyError?: string;
  limits: { maxRecipients: number; delayMs: number };
};

type BulkMailResponse = {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  failures: { email: string; error: string }[];
  error?: string;
};

const TEMPLATE_IDS = Object.keys(EMAIL_TEMPLATE_PRESETS) as EmailTemplateId[];

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [loadingSmtp, setLoadingSmtp] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [templateId, setTemplateId] = useState<EmailTemplateId>('announcement');
  const [subject, setSubject] = useState(EMAIL_TEMPLATE_PRESETS.announcement.defaultSubject);
  const [hook, setHook] = useState(EMAIL_TEMPLATE_PRESETS.announcement.defaultHook);
  const [preheader, setPreheader] = useState(EMAIL_TEMPLATE_PRESETS.announcement.defaultPreheader);
  const [message, setMessage] = useState(
    'Hi {{name}},\n\nWe have exciting updates on your Peer Academy dashboard — new content, smoother navigation, and tools to help you learn faster.\n\nJump in when you are ready.'
  );
  const [ctaLabel, setCtaLabel] = useState(EMAIL_TEMPLATE_PRESETS.announcement.defaultCtaLabel);
  const [ctaUrl, setCtaUrl] = useState('');
  const [extraEmails, setExtraEmails] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const preset = EMAIL_TEMPLATE_PRESETS[templateId];
  const appUrl = getAppBaseUrl();

  const applyTemplate = useCallback((id: EmailTemplateId) => {
    const p = EMAIL_TEMPLATE_PRESETS[id];
    setTemplateId(id);
    setSubject(p.defaultSubject);
    setHook(p.defaultHook);
    setPreheader(p.defaultPreheader);
    setCtaLabel(p.defaultCtaLabel);
  }, []);

  const previewHtml = useMemo(() => {
    const { html } = buildPeerAcademyEmail({
      templateId,
      hook,
      preheader,
      bodyParagraphs: message
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean),
      ctaLabel,
      ctaUrl: ctaUrl.trim() || `${appUrl}/dashboard`,
      recipientName: 'Alex',
      recipientEmail: 'learner@example.com',
    });
    return html;
  }, [templateId, hook, preheader, message, ctaLabel, ctaUrl, appUrl]);

  const loadSmtpStatus = useCallback(async () => {
    setLoadingSmtp(true);
    try {
      const res = await adminFetch('/api/admin/bulk-mail');
      if (!res.ok) throw new Error('Failed to load SMTP status');
      setSmtpStatus(await res.json());
    } catch {
      setSmtpStatus(null);
    } finally {
      setLoadingSmtp(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data.filter((u) => u.email?.trim()));
      setSelectedIds(new Set());
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
    loadSmtpStatus();
  }, [loadUsers, loadSmtpStatus]);

  const usersWithEmail = useMemo(
    () => users.filter((u) => u.email?.includes('@')),
    [users]
  );

  const parsedExtra = useMemo(() => {
    return extraEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'));
  }, [extraEmails]);

  const selectedUsers = useMemo(
    () => usersWithEmail.filter((u) => selectedIds.has(u.uid)),
    [usersWithEmail, selectedIds]
  );

  const recipientCount = useMemo(() => {
    const emails = new Set<string>();
    for (const u of selectedUsers) {
      if (u.email) emails.add(u.email.trim().toLowerCase());
    }
    for (const e of parsedExtra) emails.add(e);
    return emails.size;
  }, [selectedUsers, parsedExtra]);

  const allSelected =
    usersWithEmail.length > 0 && selectedIds.size === usersWithEmail.length;

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(usersWithEmail.map((u) => u.uid)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleUser = (uid: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(uid);
      else next.delete(uid);
      return next;
    });
  };

  const handleSend = async () => {
    if (!subject.trim() || !hook.trim() || !message.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Subject, headline hook, and message are required.',
        variant: 'destructive',
      });
      return;
    }

    if (recipientCount === 0) {
      toast({
        title: 'No recipients',
        description: 'Select users or add email addresses.',
        variant: 'destructive',
      });
      return;
    }

    const max = smtpStatus?.limits.maxRecipients ?? 200;
    if (recipientCount > max) {
      toast({
        title: 'Too many recipients',
        description: `Maximum ${max} recipients per send.`,
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const recipients = [
        ...selectedUsers.map((u) => ({
          email: u.email!,
          name: u.displayName,
        })),
        ...parsedExtra.map((email) => ({ email })),
      ];

      const res = await adminFetch('/api/admin/bulk-mail', {
        method: 'POST',
        body: JSON.stringify({
          branded: true,
          templateId,
          subject: subject.trim(),
          hook: hook.trim(),
          preheader: preheader.trim(),
          message: message.trim(),
          ctaLabel: ctaLabel.trim(),
          ctaUrl: ctaUrl.trim() || `${appUrl}/dashboard`,
          recipients,
        }),
      });

      const data = (await res.json()) as BulkMailResponse;

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send mail');
      }

      if (data.failed > 0) {
        toast({
          title: 'Partially sent',
          description: `Sent ${data.sent} of ${data.total}. ${data.failed} failed.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Emails sent',
          description: `Successfully sent ${data.sent} branded notification(s).`,
        });
      }
    } catch (error) {
      toast({
        title: 'Send failed',
        description: error instanceof Error ? error.message : 'Could not send mail.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk notifications</h1>
        <p className="text-muted-foreground mt-1">
          Send branded Peer Academy emails — midnight &amp; royal dashboard style with a strong hook.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSmtp ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : !smtpStatus?.configured ? (
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">Configure SMTP in <code className="text-xs bg-muted px-1 rounded">.env.local</code> and restart the dev server.</p>
            </div>
          ) : smtpStatus.verified ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Gmail SMTP connected</span>
              <Badge variant="secondary">max {smtpStatus.limits.maxRecipients} / batch</Badge>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{smtpStatus.verifyError || 'SMTP verification failed.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Branded template
              </CardTitle>
              <CardDescription>
                Matches Peer Portal — royal blue, midnight header, dashboard stat cards, and flare accent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select
                  value={templateId}
                  onValueChange={(v) => applyTemplate(v as EmailTemplateId)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_IDS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {EMAIL_TEMPLATE_PRESETS[id].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hook">Headline hook</Label>
                <Input
                  id="hook"
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder={preset.defaultHook}
                />
                <p className="text-xs text-muted-foreground">
                  Large hero line in the email — first thing learners read.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preheader">Inbox preview (preheader)</Label>
                <Input
                  id="preheader"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message body</Label>
                <Textarea
                  id="message"
                  className="min-h-[160px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{'{{name}}'}</code> and{' '}
                  <code className="bg-muted px-1 rounded">{'{{email}}'}</code> for personalization.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaLabel">Button label</Label>
                  <Input
                    id="ctaLabel"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">Button URL</Label>
                  <Input
                    id="ctaUrl"
                    placeholder={`${appUrl}/dashboard`}
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extra">Additional emails (optional)</Label>
                <Textarea
                  id="extra"
                  className="min-h-[72px] font-mono text-sm"
                  placeholder="one@example.com, two@example.com"
                  value={extraEmails}
                  onChange={(e) => setExtraEmails(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Hide preview' : 'Show preview'}
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    sending ||
                    !smtpStatus?.configured ||
                    !smtpStatus?.verified ||
                    recipientCount === 0
                  }
                  onClick={handleSend}
                >
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send {recipientCount} email{recipientCount === 1 ? '' : 's'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Recipients</CardTitle>
                  <CardDescription>Select registered users to notify.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={(v) => toggleAll(v === true)}
                    disabled={loadingUsers || usersWithEmail.length === 0}
                  />
                  <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer">
                    All
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersWithEmail.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No users with email found.</p>
              ) : (
                <ul className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                  {usersWithEmail.map((u) => (
                    <li
                      key={u.uid}
                      className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/40"
                    >
                      <Checkbox
                        id={`user-${u.uid}`}
                        checked={selectedIds.has(u.uid)}
                        onCheckedChange={(v) => toggleUser(u.uid, v === true)}
                      />
                      <label htmlFor={`user-${u.uid}`} className="flex-1 cursor-pointer min-w-0">
                        <p className="font-medium truncate">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {showPreview && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>
                Badge: <Badge className="ml-1 capitalize">{preset.badge}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t bg-muted/30 p-2">
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="w-full min-h-[640px] rounded-md border bg-white"
                  sandbox=""
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
