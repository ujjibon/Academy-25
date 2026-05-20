'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CertificateFormState, PartnerLogoPlacement } from '@/lib/certificate-customization';
import {
  formStateToStoredDefaults,
  setStoredCertificateDefaults,
  setStoredPartnerLogoDataUrl,
} from '@/lib/certificate-customization-storage';
import { fileToCertificateLogoDataUrl } from '@/lib/certificate-image-utils';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  ChevronDown,
  ImagePlus,
  PenLine,
  Save,
  Settings2,
  Signature,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEMENT_LABELS: Record<PartnerLogoPlacement, string> = {
  'beside-peer': 'Beside Peer Portal logo (header)',
  'below-peer': 'Below Peer Portal logo (header)',
  'footer-left': 'Footer — bottom left',
  'footer-right': 'Footer — bottom right',
};

type Props = {
  value: CertificateFormState;
  onChange: (next: CertificateFormState) => void;
  showSaveDefaults?: boolean;
  className?: string;
};

export function CertificateCustomizer({
  value,
  onChange,
  showSaveDefaults = false,
  className,
}: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [openRecipient, setOpenRecipient] = useState(true);
  const [openText, setOpenText] = useState(false);
  const [openBranding, setOpenBranding] = useState(true);
  const [openDisplay, setOpenDisplay] = useState(false);
  const [openSignatures, setOpenSignatures] = useState(true);

  const patch = (partial: Partial<CertificateFormState>) => onChange({ ...value, ...partial });

  const patchSignature = (
    index: number,
    partial: Partial<CertificateFormState['signatures'][0]>
  ) => {
    const signatures = value.signatures.map((s, i) =>
      i === index ? { ...s, ...partial } : s
    );
    patch({ signatures });
  };

  const handlePartnerLogoFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await fileToCertificateLogoDataUrl(file);
      patch({ partnerLogoDataUrl: dataUrl, showPartnerLogo: true });
      toast({ title: 'Partner logo added', description: 'Logo will appear on your certificate PDF.' });
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: e instanceof Error ? e.message : 'Could not process image.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePartnerLogo = () => {
    patch({ partnerLogoDataUrl: '', showPartnerLogo: false });
    setStoredPartnerLogoDataUrl('');
  };

  const handleSaveDefaults = () => {
    setStoredCertificateDefaults(
      formStateToStoredDefaults({ ...value, partnerLogoDataUrl: value.partnerLogoDataUrl })
    );
    toast({
      title: 'Defaults saved',
      description: 'Branding, signatures, and text settings saved for future certificates.',
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <PenLine className="h-4 w-4 text-primary" />
        Customize certificate
      </div>

      <Collapsible open={openRecipient} onOpenChange={setOpenRecipient}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50">
          Recipient & program
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', openRecipient && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3 px-0.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cert-recipient-name">Recipient name</Label>
              <Input
                id="cert-recipient-name"
                value={value.recipientName}
                onChange={(e) => patch({ recipientName: e.target.value })}
                placeholder="Full name on certificate"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cert-program-title">Program / course title</Label>
              <Input
                id="cert-program-title"
                value={value.programTitle}
                onChange={(e) => patch({ programTitle: e.target.value })}
                placeholder="Course or training title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cert-issued">Issue date</Label>
              <Input
                id="cert-issued"
                type="date"
                value={value.issuedAt}
                onChange={(e) => patch({ issuedAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cert-reference">Reference / credential ID (optional)</Label>
              <Input
                id="cert-reference"
                value={value.customReference}
                onChange={(e) => patch({ customReference: e.target.value })}
                placeholder="e.g. PA-2025-0042"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cert-summary">Completion summary (optional)</Label>
              <Textarea
                id="cert-summary"
                value={value.completionSummary}
                onChange={(e) => patch({ completionSummary: e.target.value })}
                placeholder="Brief note printed below the program title"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openText} onOpenChange={setOpenText}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50">
          Certificate text & footer
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', openText && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3 px-0.5">
          <div className="space-y-1.5">
            <Label htmlFor="cert-headline">Headline</Label>
            <Input
              id="cert-headline"
              value={value.headline}
              onChange={(e) => patch({ headline: e.target.value })}
              placeholder="Certificate of Completion"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-subtitle">Subtitle (optional)</Label>
            <Input
              id="cert-subtitle"
              value={value.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value })}
              placeholder="e.g. With distinction for outstanding achievement"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-certify">Opening line</Label>
            <Input
              id="cert-certify"
              value={value.certifyText}
              onChange={(e) => patch({ certifyText: e.target.value })}
              placeholder="This is to certify that"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-completion-phrase">Completion phrase</Label>
            <Input
              id="cert-completion-phrase"
              value={value.completionPhrase}
              onChange={(e) => patch({ completionPhrase: e.target.value })}
              placeholder="has successfully completed the course"
            />
            <p className="text-xs text-muted-foreground">
              Full sentence printed after the recipient name.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-org">Footer organization line</Label>
            <Input
              id="cert-org"
              value={value.organizationLine}
              onChange={(e) => patch({ organizationLine: e.target.value })}
              placeholder="Peer Portal · Peer Academy"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openBranding} onOpenChange={setOpenBranding}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50">
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Logos & partner branding
          </span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', openBranding && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3 px-0.5">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="cert-show-peer-logo" className="text-sm font-normal cursor-pointer">
              Show Peer Portal logo
            </Label>
            <Switch
              id="cert-show-peer-logo"
              checked={value.showPeerPortalLogo}
              onCheckedChange={(showPeerPortalLogo) => patch({ showPeerPortalLogo })}
            />
          </div>

          <div className="rounded-lg border border-dashed border-border p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Partner / organization logo</Label>
              <Switch
                checked={value.showPartnerLogo}
                onCheckedChange={(showPartnerLogo) => patch({ showPartnerLogo })}
                disabled={!value.partnerLogoDataUrl}
              />
            </div>

            {value.partnerLogoDataUrl ? (
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-28 rounded-md border border-border bg-white flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value.partnerLogoDataUrl}
                    alt="Partner logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    Replace logo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={removePartnerLogo}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {uploadingLogo ? 'Processing…' : 'Upload partner logo'}
              </Button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handlePartnerLogoFile(e.target.files?.[0])}
            />

            <div className="space-y-1.5">
              <Label htmlFor="partner-label">Logo label</Label>
              <Input
                id="partner-label"
                value={value.partnerLogoLabel}
                onChange={(e) => patch({ partnerLogoLabel: e.target.value })}
                placeholder="In partnership with"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Logo placement</Label>
              <Select
                value={value.partnerLogoPlacement}
                onValueChange={(v) =>
                  patch({ partnerLogoPlacement: v as PartnerLogoPlacement })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLACEMENT_LABELS) as PartnerLogoPlacement[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PLACEMENT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG or JPG recommended. Logo is stored on this device for reuse.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openDisplay} onOpenChange={setOpenDisplay}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50">
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Display options
          </span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', openDisplay && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-3 px-0.5">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="cert-show-seal" className="text-sm font-normal cursor-pointer">
              Show verification seal
            </Label>
            <Switch
              id="cert-show-seal"
              checked={value.showVerificationSeal}
              onCheckedChange={(showVerificationSeal) => patch({ showVerificationSeal })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="cert-show-sigs" className="text-sm font-normal cursor-pointer">
              Show signature lines
            </Label>
            <Switch
              id="cert-show-sigs"
              checked={value.showSignatures}
              onCheckedChange={(showSignatures) => patch({ showSignatures })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSignatures} onOpenChange={setOpenSignatures}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50">
          <span className="flex items-center gap-2">
            <Signature className="h-4 w-4" />
            Signatures
          </span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', openSignatures && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3 px-0.5">
          {value.showSignatures && (
            <div className="grid gap-4 sm:grid-cols-2">
              {value.signatures.map((sig, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border border-dashed border-border p-3 bg-muted/20"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Signature {index + 1}
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor={`sig-name-${index}`}>Signer name (on line)</Label>
                    <Input
                      id={`sig-name-${index}`}
                      value={sig.signerName}
                      onChange={(e) =>
                        patchSignature(index, { signerName: e.target.value })
                      }
                      placeholder="e.g. Dr. Jane Smith"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`sig-title-${index}`}>Title / role</Label>
                    <Input
                      id={`sig-title-${index}`}
                      value={sig.signerTitle}
                      onChange={(e) =>
                        patchSignature(index, { signerTitle: e.target.value })
                      }
                      placeholder="Program Director"
                    />
                  </div>
                  <div className="pt-2 border-t border-border/80" aria-hidden>
                    <div className="h-px bg-border w-full mb-1" />
                    <p className="text-[10px] text-muted-foreground text-center italic truncate min-h-[14px]">
                      {sig.signerName || ' '}
                    </p>
                    <p className="text-[10px] text-muted-foreground text-center truncate">
                      {sig.signerTitle || 'Title'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {showSaveDefaults ? (
        <Button type="button" variant="outline" size="sm" onClick={handleSaveDefaults}>
          <Save className="mr-2 h-4 w-4" />
          Save all customization defaults
        </Button>
      ) : null}
    </div>
  );
}
