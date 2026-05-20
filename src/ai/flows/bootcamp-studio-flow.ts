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
  description: z.string().optional(),
  coverImage: z.string().optional(),
  sections: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      order: z.number().optional(),
    })
  ).min(2),
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
      sectionId: z.string().optional(),
    })
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      reportRequirements: z.array(z.string()).min(2),
      points: z.number().optional(),
      weekLabel: z.string().optional(),
    })
  ).min(2),
  taskSubmissionFlow: z.object({
    workflow: z.array(z.string()).min(3),
    evaluationCriteria: z.array(z.string()).min(3),
    aiSupport: z.array(z.string()).min(2),
  }),
  mentorship: z.object({
    enabled: z.boolean(),
    title: z.string(),
    description: z.string(),
    sessionFrequency: z.string(),
    mentorFocusAreas: z.array(z.string()).min(2),
    bookingNotes: z.string(),
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
1) Produce at least 2 curriculum sections (modules) with clear titles.
2) Produce a full timeline with clear weekly outcomes.
3) Include practical materials (lessons, assignments, projects, quizzes, readings).
4) Include at least 2 project report submissions with reportRequirements.
5) Include a one-to-one mentorship section (enabled, focus areas, booking notes).
6) Include a task submission flow with AI support features (auto feedback, rubric suggestions, retry guidance).
7) Generate separate dashboard configuration for learner, instructor, and admin roles, each customizable.
8) Return a production-ready course object with at least 4 lessons.
9) Ensure every lesson has practice and assessment questions where each correctAnswer exactly matches one option.
10) Keep the output concise but specific and strictly valid for the provided schema.`,
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
