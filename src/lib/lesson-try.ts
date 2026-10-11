import { z } from 'zod';

export const LessonTryRequestSchema = z.object({
  courseId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,95}$/),
  lessonId: z.number().int().min(1).max(9999),
  prompt: z.string().trim().min(8).max(1800),
}).strict();

export const LessonTryResultSchema = z.object({
  generated: z.literal(true),
  output: z.string().trim().min(1).max(6000),
  explanation: z.string().trim().min(1).max(1800),
  nextTry: z.string().trim().min(1).max(600),
  checks: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    passed: z.boolean(),
    reason: z.string().trim().min(1).max(400),
  }).strict()).length(3),
}).strict();

export type LessonTryResult = z.infer<typeof LessonTryResultSchema>;
