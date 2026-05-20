'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  getCertificateTemplate,
  type CertificateTemplateId,
} from '@/lib/certificate-templates';
import { CertificateTemplatePreviewArt } from '@/components/certificates/CertificateTemplatePreviewArt';
import type { CertificateRequest } from '@/lib/training-types';
import { Download, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Props = {
  templateId: CertificateTemplateId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate?: (id: CertificateTemplateId) => void;
  /** When set, sample PDF uses these details instead of generic placeholders */
  previewRequest?: CertificateRequest | null;
};

export function CertificateTemplatePreviewDialog({
  templateId,
  open,
  onOpenChange,
  onUseTemplate,
  previewRequest,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const template = templateId ? getCertificateTemplate(templateId) : null;

  const handleSamplePdf = async () => {
    if (!templateId) return;
    setDownloading(true);
    try {
      const body: CertificateRequest = previewRequest
        ? { ...previewRequest, templateId: templateId ?? previewRequest.templateId }
        : {
            type: 'course',
            title: 'Introduction to Web Development',
            skillOrCourseId: 'preview-sample',
            recipientName: 'Alex Johnson',
            completionSummary:
              'Sample preview — your actual certificate will show your name and completed program.',
            templateId: templateId ?? undefined,
          };

      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Preview generation failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `peer-portal-preview-${templateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: 'Sample PDF downloaded',
        description: 'This preview uses sample data. Your real certificate uses your details.',
      });
    } catch (e) {
      toast({
        title: 'Preview failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {template.name}
          </DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 bg-muted/40 border-y border-border">
          <CertificateTemplatePreviewArt
            template={template}
            size="default"
            showSampleText
            recipientName={previewRequest?.recipientName}
            programTitle={previewRequest?.title}
            completionSummary={previewRequest?.completionSummary}
            issuedAt={previewRequest?.issuedAt}
            headline={previewRequest?.customization?.headline}
            subtitle={previewRequest?.customization?.subtitle}
            certifyText={previewRequest?.customization?.certifyText}
            completionPhrase={previewRequest?.customization?.completionPhrase}
            signatures={previewRequest?.customization?.signatures}
            showSignatures={previewRequest?.customization?.showSignatures}
            showPeerPortalLogo={previewRequest?.customization?.showPeerPortalLogo}
            showVerificationSeal={previewRequest?.customization?.showVerificationSeal}
            partnerLogoDataUrl={previewRequest?.customization?.partnerLogoDataUrl}
            partnerLogoLabel={previewRequest?.customization?.partnerLogoLabel}
            partnerLogoPlacement={previewRequest?.customization?.partnerLogoPlacement}
            showPartnerLogo={previewRequest?.customization?.showPartnerLogo}
            className="shadow-lg border border-border/60 max-h-[min(52vh,420px)]"
          />
          <p className="text-xs text-muted-foreground text-center mt-3">
            Visual preview — download sample PDF below for the exact exported layout.
          </p>
        </div>

        <DialogFooter className="px-6 py-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSamplePdf}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download sample PDF
          </Button>
          {onUseTemplate && templateId ? (
            <Button
              type="button"
              onClick={() => {
                onUseTemplate(templateId);
                onOpenChange(false);
              }}
            >
              Use this template
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
