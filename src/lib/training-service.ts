'use client';

import type { SkillTrainingProgram, CertificateRecord } from '@/lib/training-types';

const trainingsKey = (uid: string) => `peer_academy_trainings_${uid}`;
const certsKey = (uid: string) => `peer_academy_certificates_${uid}`;

export function getStoredTrainings(uid: string): SkillTrainingProgram[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(trainingsKey(uid));
    if (!raw) return [];
    return JSON.parse(raw) as SkillTrainingProgram[];
  } catch {
    return [];
  }
}

export function saveTraining(uid: string, program: SkillTrainingProgram): void {
  const list = getStoredTrainings(uid).filter((t) => t.id !== program.id);
  list.unshift(program);
  localStorage.setItem(trainingsKey(uid), JSON.stringify(list));
}

export function getTrainingById(uid: string, id: string): SkillTrainingProgram | null {
  return getStoredTrainings(uid).find((t) => t.id === id) ?? null;
}

export function markTrainingComplete(
  uid: string,
  trainingId: string
): SkillTrainingProgram | null {
  const list = getStoredTrainings(uid);
  const idx = list.findIndex((t) => t.id === trainingId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(trainingsKey(uid), JSON.stringify(list));
  return list[idx];
}

export function getStoredCertificates(uid: string): CertificateRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(certsKey(uid));
    if (!raw) return [];
    return JSON.parse(raw) as CertificateRecord[];
  } catch {
    return [];
  }
}

export function recordCertificate(uid: string, record: CertificateRecord): void {
  const list = getStoredCertificates(uid).filter((c) => c.id !== record.id);
  list.unshift(record);
  localStorage.setItem(certsKey(uid), JSON.stringify(list));
}
