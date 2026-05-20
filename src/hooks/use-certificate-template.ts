'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  type CertificateTemplateId,
} from '@/lib/certificate-templates';
import {
  getStoredCertificateTemplateId,
  setStoredCertificateTemplateId,
} from '@/lib/certificate-template-storage';

export function useCertificateTemplate() {
  const [templateId, setTemplateIdState] = useState<CertificateTemplateId>(
    DEFAULT_CERTIFICATE_TEMPLATE
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTemplateIdState(getStoredCertificateTemplateId());
    setReady(true);
  }, []);

  const setTemplateId = useCallback((id: CertificateTemplateId) => {
    setTemplateIdState(id);
    setStoredCertificateTemplateId(id);
  }, []);

  return { templateId, setTemplateId, ready };
}
