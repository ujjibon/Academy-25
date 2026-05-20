'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CertificateRequest } from '@/lib/training-types';
import { recordCertificate } from '@/lib/training-service';

type Props = {
  payload: CertificateRequest;
  uid?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  label?: string;
};

export function CertificateDownloadButton({
  payload,
  uid,
  variant = 'default',
  size = 'default',
  className,
  label = 'Download Certificate (PDF)',
}: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Certificate generation failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] || 'peer-academy-certificate.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      if (uid) {
        recordCertificate(uid, {
          id: `${payload.type}-${payload.skillOrCourseId}`,
          type: payload.type,
          title: payload.title,
          skillOrCourseId: payload.skillOrCourseId,
          recipientName: payload.recipientName,
          issuedAt: payload.issuedAt || new Date().toISOString(),
          completionSummary: payload.completionSummary,
        });
      }

      toast({ title: 'Certificate downloaded', description: 'Your PDF is ready.' });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Download failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

export function CertificateBadgeIcon({ className }: { className?: string }) {
  return <Award className={className} />;
}
