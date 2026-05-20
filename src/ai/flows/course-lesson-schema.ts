import { z } from 'zod';

export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(4).max(4),
  correctAnswer: z.string(),
});

export const LessonSchema = z.object({
  id: z.string().describe("Lesson id as a string, e.g. '1', '2'."),
  title: z.string(),
  duration: z.number().describe('Estimated minutes.'),
  introduction: z.object({
    text: z.string(),
  }),
  practice: z.object({
    questions: z.array(QuizQuestionSchema).min(5),
  }),
  project: z.object({
    title: z.string(),
    description: z.string(),
    code: z
      .object({
        language: z.enum([
          'javascript',
          'typescript',
          'jsx',
          'tsx',
          'python',
          'html',
          'css',
          'java',
          'cpp',
        ]),
        starterCode: z.string().optional(),
        enablePreview: z.boolean().optional(),
        enableConsole: z.boolean().optional(),
      })
      .optional(),
  }),
  assessment: z.object({
    questions: z.array(QuizQuestionSchema).min(5),
  }),
});

export type LessonOutput = z.infer<typeof LessonSchema>;

export const CourseOutlineSchema = z.object({
  id: z.string().describe('URL-friendly course slug.'),
  title: z.string(),
  description: z.string(),
  image: z.string().url(),
  category: z.enum(['general', 'programming']).default('general'),
  codeLanguage: z
    .enum(['javascript', 'typescript', 'jsx', 'tsx', 'python', 'html', 'css', 'java', 'cpp'])
    .optional(),
  audience: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  modules: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        weekLabel: z.string().optional(),
        lessons: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              topic: z.string().describe('Specific focus for content generation.'),
              duration: z.number(),
              learningObjectives: z.array(z.string()).min(1),
            })
          )
          .min(1),
      })
    )
    .min(1),
  agentNotes: z.string().describe('Strategic notes for the instructor.'),
});

export type CourseOutline = z.infer<typeof CourseOutlineSchema>;

export function flattenOutlineLessons(outline: CourseOutline) {
  return outline.modules.flatMap((mod) =>
    mod.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: mod.title,
      weekLabel: mod.weekLabel,
    }))
  );
}
