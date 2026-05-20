import type { CertificateFormState, CertificateSignatureSlot } from '@/lib/certificate-customization';

const STORAGE_KEY = 'peer_academy_certificate_defaults';
const PARTNER_LOGO_KEY = 'peer_academy_certificate_partner_logo';

export type StoredCertificateDefaults = {
  certifyText?: string;
  organizationLine?: string;
  headline?: string;
  subtitle?: string;
  completionPhrase?: string;
  customReference?: string;
  signatures?: CertificateSignatureSlot[];
  showSignatures?: boolean;
  showPeerPortalLogo?: boolean;
  showVerificationSeal?: boolean;
  showPartnerLogo?: boolean;
  partnerLogoLabel?: string;
  partnerLogoPlacement?: CertificateFormState['partnerLogoPlacement'];
};

export function getStoredPartnerLogoDataUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(PARTNER_LOGO_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredPartnerLogoDataUrl(dataUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!dataUrl) {
      localStorage.removeItem(PARTNER_LOGO_KEY);
      return;
    }
    localStorage.setItem(PARTNER_LOGO_KEY, dataUrl);
  } catch {
    /* ignore quota */
  }
}

export function getStoredCertificateDefaults(): StoredCertificateDefaults | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCertificateDefaults;
  } catch {
    return null;
  }
}

export function setStoredCertificateDefaults(defaults: StoredCertificateDefaults): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    /* ignore */
  }
}

export function storedDefaultsToFormPatch(
  stored: StoredCertificateDefaults | null
): Partial<CertificateFormState> | null {
  if (!stored) return null;
  const partnerLogo = getStoredPartnerLogoDataUrl();
  return {
    certifyText: stored.certifyText,
    organizationLine: stored.organizationLine,
    headline: stored.headline,
    subtitle: stored.subtitle,
    completionPhrase: stored.completionPhrase,
    customReference: stored.customReference,
    signatures: stored.signatures,
    showSignatures: stored.showSignatures,
    showPeerPortalLogo: stored.showPeerPortalLogo,
    showVerificationSeal: stored.showVerificationSeal,
    showPartnerLogo: stored.showPartnerLogo ?? !!partnerLogo,
    partnerLogoDataUrl: partnerLogo,
    partnerLogoLabel: stored.partnerLogoLabel,
    partnerLogoPlacement: stored.partnerLogoPlacement,
  };
}

export function formStateToStoredDefaults(
  form: Pick<
    CertificateFormState,
    | 'certifyText'
    | 'organizationLine'
    | 'headline'
    | 'subtitle'
    | 'completionPhrase'
    | 'customReference'
    | 'signatures'
    | 'showSignatures'
    | 'showPeerPortalLogo'
    | 'showVerificationSeal'
    | 'showPartnerLogo'
    | 'partnerLogoLabel'
    | 'partnerLogoPlacement'
  > & { partnerLogoDataUrl?: string }
): StoredCertificateDefaults {
  if (form.partnerLogoDataUrl) {
    setStoredPartnerLogoDataUrl(form.partnerLogoDataUrl);
  }
  return {
    certifyText: form.certifyText,
    organizationLine: form.organizationLine,
    headline: form.headline,
    subtitle: form.subtitle,
    completionPhrase: form.completionPhrase,
    customReference: form.customReference,
    signatures: form.signatures,
    showSignatures: form.showSignatures,
    showPeerPortalLogo: form.showPeerPortalLogo,
    showVerificationSeal: form.showVerificationSeal,
    showPartnerLogo: form.showPartnerLogo,
    partnerLogoLabel: form.partnerLogoLabel,
    partnerLogoPlacement: form.partnerLogoPlacement,
  };
}
