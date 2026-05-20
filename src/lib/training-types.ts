import type { GenerateSkillTrainingOutput } from '@/ai/flows/generate-skill-training-flow';

export type SkillTrainingProgram = GenerateSkillTrainingOutput & {
  createdAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
};

export type CertificateType = 'course' | 'training';

export type CertificateRecord = {
  id: string;
  type: CertificateType;
  title: string;
  skillOrCourseId: string;
  recipientName: string;
  issuedAt: string;
  completionSummary?: string;
};

export type CertificateRequest = {
  type: CertificateType;
  title: string;
  skillOrCourseId: string;
  recipientName: string;
  recipientEmail?: string;
  completionSummary?: string;
  issuedAt?: string;
};
