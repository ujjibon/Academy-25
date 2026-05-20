import type { CertificateTemplateId } from '@/lib/certificate-templates';
import type { CertificateRequest } from '@/lib/training-types';

export type CertificateSignatureSlot = {
  signerName: string;
  signerTitle: string;
};

export type PartnerLogoPlacement = 'beside-peer' | 'below-peer' | 'footer-left' | 'footer-right';

export type CertificateCustomization = {
  headline?: string;
  subtitle?: string;
  certifyText?: string;
  completionPhrase?: string;
  organizationLine?: string;
  customReference?: string;
  signatures?: CertificateSignatureSlot[];
  showSignatures?: boolean;
  showPeerPortalLogo?: boolean;
  showVerificationSeal?: boolean;
  showPartnerLogo?: boolean;
  partnerLogoDataUrl?: string;
  partnerLogoLabel?: string;
  partnerLogoPlacement?: PartnerLogoPlacement;
};

export type CertificateFormState = {
  recipientName: string;
  programTitle: string;
  completionSummary: string;
  issuedAt: string;
  headline: string;
  subtitle: string;
  certifyText: string;
  completionPhrase: string;
  organizationLine: string;
  customReference: string;
  signatures: CertificateSignatureSlot[];
  showSignatures: boolean;
  showPeerPortalLogo: boolean;
  showVerificationSeal: boolean;
  showPartnerLogo: boolean;
  partnerLogoDataUrl: string;
  partnerLogoLabel: string;
  partnerLogoPlacement: PartnerLogoPlacement;
};

export const DEFAULT_CERTIFY_TEXT = 'This is to certify that';

export const DEFAULT_ORGANIZATION_LINE = 'Peer Portal · Peer Academy';

export const DEFAULT_PARTNER_LOGO_LABEL = 'In partnership with';

export const DEFAULT_SIGNATURE_SLOTS: CertificateSignatureSlot[] = [
  { signerName: '', signerTitle: 'Program Director' },
  { signerName: '', signerTitle: 'Peer Academy' },
];

export function defaultHeadlineForTemplate(templateId: CertificateTemplateId): string {
  switch (templateId) {
    case 'executive-diploma':
      return 'Diploma of Achievement';
    case 'laurel-honors':
      return 'Honors Certificate';
    default:
      return 'Certificate of Completion';
  }
}

export function defaultCompletionPhrase(type: 'course' | 'training'): string {
  const typeLabel = type === 'course' ? 'course' : 'professional training program';
  return `has successfully completed the ${typeLabel}`;
}

export function createCertificateFormState(
  base: Pick<
    CertificateRequest,
    'recipientName' | 'title' | 'completionSummary' | 'issuedAt' | 'templateId'
  > & { type?: CertificateRequest['type'] }
): CertificateFormState {
  const templateId = base.templateId ?? 'peer-portal-classic';
  return {
    recipientName: base.recipientName,
    programTitle: base.title,
    completionSummary: base.completionSummary ?? '',
    issuedAt: base.issuedAt
      ? base.issuedAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    headline: defaultHeadlineForTemplate(templateId),
    subtitle: '',
    certifyText: DEFAULT_CERTIFY_TEXT,
    completionPhrase: defaultCompletionPhrase(base.type ?? 'course'),
    organizationLine: DEFAULT_ORGANIZATION_LINE,
    customReference: '',
    signatures: DEFAULT_SIGNATURE_SLOTS.map((s) => ({ ...s })),
    showSignatures: true,
    showPeerPortalLogo: true,
    showVerificationSeal: true,
    showPartnerLogo: false,
    partnerLogoDataUrl: '',
    partnerLogoLabel: DEFAULT_PARTNER_LOGO_LABEL,
    partnerLogoPlacement: 'beside-peer',
  };
}

export function applyStoredDefaults(
  form: CertificateFormState,
  stored: Partial<CertificateFormState> | null
): CertificateFormState {
  if (!stored) return form;
  return {
    ...form,
    certifyText: stored.certifyText ?? form.certifyText,
    organizationLine: stored.organizationLine ?? form.organizationLine,
    signatures: stored.signatures?.length
      ? stored.signatures.map((s) => ({ ...s }))
      : form.signatures,
    showSignatures: stored.showSignatures ?? form.showSignatures,
    headline: stored.headline ?? form.headline,
    subtitle: stored.subtitle ?? form.subtitle,
    completionPhrase: stored.completionPhrase ?? form.completionPhrase,
    showPeerPortalLogo: stored.showPeerPortalLogo ?? form.showPeerPortalLogo,
    showVerificationSeal: stored.showVerificationSeal ?? form.showVerificationSeal,
    showPartnerLogo: stored.showPartnerLogo ?? form.showPartnerLogo,
    partnerLogoDataUrl: stored.partnerLogoDataUrl ?? form.partnerLogoDataUrl,
    partnerLogoLabel: stored.partnerLogoLabel ?? form.partnerLogoLabel,
    partnerLogoPlacement: stored.partnerLogoPlacement ?? form.partnerLogoPlacement,
    customReference: stored.customReference ?? form.customReference,
  };
}

export type ResolvedCertificateFields = {
  recipientName: string;
  title: string;
  completionSummary?: string;
  issued: string;
  headline: string;
  subtitle?: string;
  certifyText: string;
  completionPhrase: string;
  organizationLine: string;
  customReference?: string;
  signatures: CertificateSignatureSlot[];
  showSignatures: boolean;
  showPeerPortalLogo: boolean;
  showVerificationSeal: boolean;
  showPartnerLogo: boolean;
  partnerLogoDataUrl?: string;
  partnerLogoLabel: string;
  partnerLogoPlacement: PartnerLogoPlacement;
};

export function resolveCertificateFields(
  data: CertificateRequest,
  templateId: CertificateTemplateId
): ResolvedCertificateFields {
  const c = data.customization;
  const issued = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const partnerDataUrl = c?.partnerLogoDataUrl?.trim();

  return {
    recipientName: data.recipientName.trim(),
    title: data.title.trim(),
    completionSummary: data.completionSummary?.trim(),
    issued,
    headline: c?.headline?.trim() || defaultHeadlineForTemplate(templateId),
    subtitle: c?.subtitle?.trim() || undefined,
    certifyText: c?.certifyText?.trim() || DEFAULT_CERTIFY_TEXT,
    completionPhrase:
      c?.completionPhrase?.trim() || defaultCompletionPhrase(data.type),
    organizationLine: c?.organizationLine?.trim() || DEFAULT_ORGANIZATION_LINE,
    customReference: c?.customReference?.trim() || undefined,
    signatures:
      c?.signatures?.length === 2
        ? c.signatures.map((s) => ({
            signerName: s.signerName?.trim() ?? '',
            signerTitle: s.signerTitle?.trim() || 'Authorized Signatory',
          }))
        : DEFAULT_SIGNATURE_SLOTS,
    showSignatures: c?.showSignatures !== false,
    showPeerPortalLogo: c?.showPeerPortalLogo !== false,
    showVerificationSeal: c?.showVerificationSeal !== false,
    showPartnerLogo: !!c?.showPartnerLogo && !!partnerDataUrl,
    partnerLogoDataUrl: partnerDataUrl || undefined,
    partnerLogoLabel: c?.partnerLogoLabel?.trim() || DEFAULT_PARTNER_LOGO_LABEL,
    partnerLogoPlacement: c?.partnerLogoPlacement ?? 'beside-peer',
  };
}

export function formStateToCertificateRequest(
  base: Omit<
    CertificateRequest,
    | 'recipientName'
    | 'title'
    | 'completionSummary'
    | 'issuedAt'
    | 'customization'
    | 'templateId'
  >,
  form: CertificateFormState,
  templateId: CertificateTemplateId
): CertificateRequest {
  return {
    ...base,
    recipientName: form.recipientName.trim(),
    title: form.programTitle.trim(),
    completionSummary: form.completionSummary.trim() || undefined,
    issuedAt: new Date(form.issuedAt + 'T12:00:00').toISOString(),
    templateId,
    customization: {
      headline: form.headline.trim(),
      subtitle: form.subtitle.trim() || undefined,
      certifyText: form.certifyText.trim(),
      completionPhrase: form.completionPhrase.trim(),
      organizationLine: form.organizationLine.trim(),
      customReference: form.customReference.trim() || undefined,
      signatures: form.signatures,
      showSignatures: form.showSignatures,
      showPeerPortalLogo: form.showPeerPortalLogo,
      showVerificationSeal: form.showVerificationSeal,
      showPartnerLogo: form.showPartnerLogo && !!form.partnerLogoDataUrl,
      partnerLogoDataUrl: form.partnerLogoDataUrl || undefined,
      partnerLogoLabel: form.partnerLogoLabel.trim(),
      partnerLogoPlacement: form.partnerLogoPlacement,
    },
  };
}
