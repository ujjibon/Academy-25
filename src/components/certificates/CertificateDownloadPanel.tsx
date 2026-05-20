'use client';

import { useState } from 'react';
import type { CertificateRequest } from '@/lib/training-types';
import { useCertificateForm } from '@/hooks/use-certificate-form';
import { CertificateCustomizer } from '@/components/certificates/CertificateCustomizer';
import { CertificateTemplatePicker } from '@/components/certificates/CertificateTemplatePicker';
import { CertificateDownloadButton } from '@/components/certificates/CertificateDownloadButton';
import { CertificateTemplatePreviewDialog } from '@/components/certificates/CertificateTemplatePreviewDialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { CertificateTemplateId } from '@/lib/certificate-templates';

type BasePayload = Omit<
  CertificateRequest,
  'recipientName' | 'title' | 'completionSummary' | 'issuedAt' | 'customization' | 'templateId'
>;

type Props = {
  base: BasePayload;
  recipientName: string;
  programTitle: string;
  completionSummary?: string;
  issuedAt?: string;
  compact?: boolean;
  showSaveDefaults?: boolean;
  downloadLabel?: string;
  uid?: string;
  className?: string;
};

export function CertificateDownloadPanel({
  base,
  recipientName,
  programTitle,
  completionSummary,
  issuedAt,
  compact = false,
  showSaveDefaults = false,
  downloadLabel,
  uid,
  className,
}: Props) {
  const { form, setForm, templateId, setTemplateId, ready, buildRequest, isValid } =
    useCertificateForm({
      recipientName,
      programTitle,
      completionSummary,
      issuedAt,
      type: base.type,
    });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<CertificateTemplateId | null>(
    null
  );

  const request = buildRequest(base);

  if (!ready || !form || !request) return null;

  return (
    <div className={className}>
      <div className="space-y-6">
        <CertificateCustomizer
          value={form}
          onChange={setForm}
          showSaveDefaults={showSaveDefaults}
        />

        <CertificateTemplatePicker compact={compact} />

        <div className="flex flex-wrap gap-2 items-center">
          <CertificateDownloadButton
            uid={uid}
            payload={request}
            label={downloadLabel}
            disabled={!isValid}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPreviewTemplateId(templateId);
              setPreviewOpen(true);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview with your details
          </Button>
        </div>
        {!isValid && (
          <p className="text-xs text-destructive">Recipient name and program title are required.</p>
        )}
      </div>

      <CertificateTemplatePreviewDialog
        templateId={previewTemplateId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUseTemplate={setTemplateId}
        previewRequest={request}
      />
    </div>
  );
}

/** Build a download request using shared form state but a different program title */
export function buildCertificateRequestForProgram(
  buildRequest: ReturnType<typeof useCertificateForm>['buildRequest'],
  base: BasePayload,
  programTitle: string,
  completionSummary?: string
) {
  return buildRequest(base, {
    programTitle,
    completionSummary: completionSummary ?? '',
  });
}
