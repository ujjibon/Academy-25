'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CertificateRequest, CertificateType } from '@/lib/training-types';
import {
  applyStoredDefaults,
  createCertificateFormState,
  defaultHeadlineForTemplate,
  formStateToCertificateRequest,
  type CertificateFormState,
} from '@/lib/certificate-customization';
import {
  getStoredCertificateDefaults,
  storedDefaultsToFormPatch,
} from '@/lib/certificate-customization-storage';
import { useCertificateTemplate } from '@/hooks/use-certificate-template';
import type { CertificateTemplateId } from '@/lib/certificate-templates';

type Initial = {
  recipientName: string;
  programTitle: string;
  completionSummary?: string;
  issuedAt?: string;
  type?: CertificateType;
};

export function useCertificateForm(initial: Initial) {
  const { templateId, setTemplateId, ready } = useCertificateTemplate();
  const [form, setForm] = useState<CertificateFormState | null>(null);
  const [prevTemplateId, setPrevTemplateId] = useState<CertificateTemplateId | null>(null);

  useEffect(() => {
    if (!ready) return;
    const base = createCertificateFormState({
      recipientName: initial.recipientName,
      title: initial.programTitle,
      completionSummary: initial.completionSummary,
      issuedAt: initial.issuedAt,
      templateId,
      type: initial.type ?? 'course',
    });
    const stored = storedDefaultsToFormPatch(getStoredCertificateDefaults());
    setForm(applyStoredDefaults(base, stored));
  }, [
    ready,
    initial.recipientName,
    initial.programTitle,
    initial.completionSummary,
    initial.issuedAt,
  ]);

  useEffect(() => {
    if (!form || !ready || prevTemplateId === null) {
      setPrevTemplateId(templateId);
      return;
    }
    if (prevTemplateId !== templateId) {
      setForm((prev) =>
        prev
          ? { ...prev, headline: defaultHeadlineForTemplate(templateId) }
          : prev
      );
      setPrevTemplateId(templateId);
    }
  }, [templateId, ready, prevTemplateId]);

  const buildRequest = useMemo(
    () =>
      (
        base: Omit<
          CertificateRequest,
          | 'recipientName'
          | 'title'
          | 'completionSummary'
          | 'issuedAt'
          | 'customization'
          | 'templateId'
        >,
        overrides?: Partial<CertificateFormState>
      ): CertificateRequest | null => {
        if (!form) return null;
        const merged = overrides ? { ...form, ...overrides } : form;
        return formStateToCertificateRequest(base, merged, templateId);
      },
    [form, templateId]
  );

  const isValid =
    !!form &&
    form.recipientName.trim().length > 0 &&
    form.programTitle.trim().length > 0;

  return {
    form,
    setForm,
    templateId,
    setTemplateId,
    ready,
    buildRequest,
    isValid,
  };
}
