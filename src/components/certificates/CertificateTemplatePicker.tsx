'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  CERTIFICATE_TEMPLATES,
  getCertificateTemplate,
  type CertificateTemplateId,
  type CertificateTemplateMeta,
} from '@/lib/certificate-templates';
import { useCertificateTemplate } from '@/hooks/use-certificate-template';
import { CertificateTemplatePreviewArt } from '@/components/certificates/CertificateTemplatePreviewArt';
import { CertificateTemplatePreviewDialog } from '@/components/certificates/CertificateTemplatePreviewDialog';
import { Button } from '@/components/ui/button';
import { Check, Eye } from 'lucide-react';

function TemplatePreviewCard({
  template,
  selected,
  onSelect,
  onPreview,
}: {
  template: CertificateTemplateMeta;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border-2 text-left transition-all overflow-hidden',
        selected ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-col flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-xl"
      >
        <CertificateTemplatePreviewArt template={template} size="compact" />
        <div className="border-t border-border bg-card px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium leading-tight">{template.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {template.description}
              </p>
            </div>
            {selected ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <div className="border-t border-border bg-muted/30 px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Preview
        </Button>
      </div>
    </div>
  );
}

function SelectedTemplateHero({
  template,
  onPreview,
}: {
  template: CertificateTemplateMeta;
  onPreview: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-[55%] p-4 bg-muted/30">
          <div className="max-w-md mx-auto">
            <CertificateTemplatePreviewArt template={template} size="large" showSampleText />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Peer Portal"
              width={120}
              height={36}
              className="h-8 w-auto object-contain"
            />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Branded PDF
            </span>
          </div>
          <div>
            <h4 className="font-heading text-lg font-semibold">{template.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Every download includes the Peer Portal logo, verification seal, signatures, and a
            unique certificate ID.
          </p>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview template
          </Button>
        </div>
      </div>
    </div>
  );
}

type Props = {
  className?: string;
  compact?: boolean;
};

export function CertificateTemplatePicker({ className, compact = false }: Props) {
  const { templateId, setTemplateId, ready } = useCertificateTemplate();
  const selected = getCertificateTemplate(templateId);
  const [previewId, setPreviewId] = useState<CertificateTemplateId | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openPreview = (id: CertificateTemplateId) => {
    setPreviewId(id);
    setPreviewOpen(true);
  };

  if (!ready) return null;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Certificate template</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {CERTIFICATE_TEMPLATES.length} professional Peer Portal designs — preview any template
            before downloading.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openPreview(templateId)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview current
        </Button>
      </div>

      {!compact && (
        <SelectedTemplateHero template={selected} onPreview={() => openPreview(templateId)} />
      )}

      <div
        className={cn(
          'grid gap-3',
          compact
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
        )}
      >
        {CERTIFICATE_TEMPLATES.map((template) => (
          <TemplatePreviewCard
            key={template.id}
            template={template}
            selected={templateId === template.id}
            onSelect={() => setTemplateId(template.id as CertificateTemplateId)}
            onPreview={() => openPreview(template.id)}
          />
        ))}
      </div>

      <CertificateTemplatePreviewDialog
        templateId={previewId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUseTemplate={setTemplateId}
      />
    </div>
  );
}
