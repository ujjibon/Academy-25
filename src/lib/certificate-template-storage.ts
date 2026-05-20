import {
  CERTIFICATE_TEMPLATE_STORAGE_KEY,
  DEFAULT_CERTIFICATE_TEMPLATE,
  type CertificateTemplateId,
  isCertificateTemplateId,
} from '@/lib/certificate-templates';

export function getStoredCertificateTemplateId(): CertificateTemplateId {
  if (typeof window === 'undefined') return DEFAULT_CERTIFICATE_TEMPLATE;
  try {
    const stored = localStorage.getItem(CERTIFICATE_TEMPLATE_STORAGE_KEY);
    if (isCertificateTemplateId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_CERTIFICATE_TEMPLATE;
}

export function setStoredCertificateTemplateId(id: CertificateTemplateId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CERTIFICATE_TEMPLATE_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
