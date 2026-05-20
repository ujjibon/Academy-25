'use server';

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number(),
  introduction: z.object({
    text: z.string(),
  }),
  practice: z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string(),
      })
    ),
  }),
  project: z.object({
    title: z.string(),
    description: z.string(),
  }),
  assessment: z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string(),
      })
    ),
  }),
});

const BootcampStudioInputSchema = z.object({
  requirements: z.string().min(10),
  sourceType: z.enum(['prompt', 'pdf']).default('prompt'),
});
export type BootcampStudioInput = z.infer<typeof BootcampStudioInputSchema>;

const DashboardConfigSchema = z.object({
  learner: z.object({
    title: z.string(),
    widgets: z.array(z.string()).min(3),
    customizations: z.array(z.string()).min(2),
  }),
  instructor: z.object({
    title: z.string(),
    widgets: z.array(z.string()).min(3),
    customizations: z.array(z.string()).min(2),
  }),
  admin: z.object({
    title: z.string(),
    widgets: z.array(z.string()).min(3),
    customizations: z.array(z.string()).min(2),
  }),
});

const BootcampStudioOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  timeline: z.array(
    z.object({
      week: z.string(),
      objective: z.string(),
      deliverables: z.array(z.string()).min(1),
    })
  ),
  materials: z.array(
    z.object({
      title: z.string(),
      type: z.enum(['lesson', 'worksheet', 'assignment', 'quiz', 'project', 'reading']),
      purpose: z.string(),
    })
  ),
  taskSubmissionFlow: z.object({
    workflow: z.array(z.string()).min(3),
    evaluationCriteria: z.array(z.string()).min(3),
    aiSupport: z.array(z.string()).min(2),
  }),
  dashboardConfig: DashboardConfigSchema,
  course: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.string(),
    lessons: z.array(LessonSchema).min(4),
  }),
});
export type BootcampStudioOutput = z.infer<typeof BootcampStudioOutputSchema>;

const prompt = ai.definePrompt({
  name: 'bootcampStudioPrompt',
  input: { schema: BootcampStudioInputSchema },
  output: { schema: BootcampStudioOutputSchema },
  prompt: `You are an expert bootcamp architect and curriculum strategist.

Generate a dynamic, implementation-ready bootcamp/course design from the requirements below.

Requirements source: {{{sourceType}}}
Requirements content:
{{{requirements}}}

Rules:
1) Produce a full timeline with clear weekly outcomes.
2) Include practical materials (lessons, assignments, projects, quizzes, readings).
3) Include a task submission flow with AI support features (auto feedback, rubric suggestions, retry guidance).
4) Generate separate dashboard configuration for learner, instructor, and admin roles, each customizable.
5) Return a production-ready course object with at least 4 lessons.
6) Ensure every lesson has practice and assessment questions where each correctAnswer exactly matches one option.
7) Keep the output concise but specific and strictly valid for the provided schema.`,
});

const bootcampStudioFlow = ai.defineFlow(
  {
    name: 'bootcampStudioFlow',
    inputSchema: BootcampStudioInputSchema,
    outputSchema: BootcampStudioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function bootcampStudio(input: BootcampStudioInput): Promise<BootcampStudioOutput> {
  return bootcampStudioFlow(input);
}
