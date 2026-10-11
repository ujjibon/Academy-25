'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Award, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { getCertificateByCode, type VerifiableCertificate } from '@/lib/learning-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = use(params);
  const [code, setCode] = useState(decodeURIComponent(rawCode || '').toUpperCase());
  const [cert, setCert] = useState<VerifiableCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getCertificateByCode(code)
      .then((result) => {
        if (cancelled) return;
        setCert(result);
        setNotFound(!result);
      })
      .catch(() => {
        if (!cancelled) {
          setCert(null);
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-16 page-stack">
        <header className="text-center space-y-2">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Certificate verification
          </h1>
          <p className="text-muted-foreground text-sm">
            Peer Academy issues verifiable credentials with a public lookup code.
          </p>
        </header>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const next = String(form.get('code') || '').trim().toUpperCase();
            if (next) {
              window.history.replaceState(null, '', `/verify/${encodeURIComponent(next)}`);
              setCode(next);
            }
          }}
        >
          <Input name="code" defaultValue={code} placeholder="PA-XXXXXXXX" className="uppercase" />
          <Button type="submit">Verify</Button>
        </form>

        {loading ? (
          <div className="dashboard-panel p-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : cert ? (
          <div className="dashboard-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold text-sm">Valid credential</span>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-heading text-xl font-semibold">{cert.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Awarded to <span className="text-foreground font-medium">{cert.recipientName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Issued {format(new Date(cert.issuedAt), 'MMMM d, yyyy')} · Code {cert.code}
                </p>
                {cert.completionSummary ? (
                  <p className="text-sm mt-3 text-foreground/90">{cert.completionSummary}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : notFound ? (
          <div className="dashboard-panel p-6 space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">No certificate found</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Double-check the code, or ask the learner to re-issue from Certificates.
            </p>
          </div>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Back to Peer Academy
          </Link>
        </p>
      </div>
    </div>
  );
}
