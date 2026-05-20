/**
 * Agentic course architect: plan outline → build lessons iteratively → optional refine.
 * Server-only — import from API routes, not client components.
 */

import { ai, OPENAI_QUALITY_MODEL } from '@/ai/genkit';
import { z } from 'genkit';
import {
  CourseOutlineSchema,
  LessonSchema,
  flattenOutlineLessons,
  type CourseOutline,
  type LessonOutput,
} from '@/ai/flows/course-lesson-schema';
import type { Course } from '@/lib/data-provider';

const MAX_BRIEF_CHARS = 18000;

const ArchitectOptionsSchema = z.object({
  lessonCount: z.number().min(4).max(12).optional(),
  category: z.enum(['general', 'programming']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  questionsPerLesson: z.number().min(5).max(25).optional(),
});

export type ArchitectOptions = z.infer<typeof ArchitectOptionsSchema>;

const PlanInputSchema = z.object({
  brief: z.string().min(10),
  sourceType: z.enum(['prompt', 'pdf']).default('prompt'),
  options: ArchitectOptionsSchema.optional(),
});

const BuildLessonInputSchema = z.object({
  brief: z.string(),
  outline: CourseOutlineSchema,
  lessonId: z.string(),
  questionsPerLesson: z.number().min(5).max(25).default(12),
});

const RefineInputSchema = z.object({
  brief: z.string().optional(),
  instruction: z.string().min(3),
  course: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.string(),
    category: z.enum(['general', 'programming']).optional(),
    lessons: z.array(LessonSchema),
  }),
});

import type { AgentStep } from '@/ai/types/course-agent-types';

export type { AgentStep, AgentStepStatus } from '@/ai/types/course-agent-types';

const planPrompt = ai.definePrompt({
  name: 'courseArchitectPlanPrompt',
  input: {
    schema: z.object({
      brief: z.string(),
      sourceType: z.string(),
      targetLessons: z.number(),
      category: z.string(),
      difficulty: z.string(),
    }),
  },
  output: { schema: CourseOutlineSchema },
  model: OPENAI_QUALITY_MODEL,
  prompt: `You are a senior curriculum architect. Design a production-ready course outline from the instructor brief.

Source: {{{sourceType}}}
Brief:
{{{brief}}}

Constraints:
- Target approximately {{{targetLessons}}} lessons across 2–4 modules/weeks.
- Category: {{{category}}} (if programming, set category programming and pick an appropriate codeLanguage).
- Difficulty: {{{difficulty}}}.
- Each lesson needs a clear topic and 2–4 learning objectives.
- Lesson ids: sequential strings "1", "2", ...
- Module ids: "m1", "m2", ...
- Course id: url-friendly slug from title.
- image: https://placehold.co/600x400.png
- agentNotes: 2–3 sentences on pedagogy and pacing.

Do not write full lesson bodies — only the outline.`,
});

const buildLessonPrompt = ai.definePrompt({
  name: 'courseArchitectLessonPrompt',
  input: {
    schema: z.object({
      brief: z.string(),
      courseTitle: z.string(),
      courseDescription: z.string(),
      moduleTitle: z.string(),
      lessonTitle: z.string(),
      lessonTopic: z.string(),
      learningObjectives: z.string(),
      priorLessons: z.string(),
      category: z.string(),
      codeLanguage: z.string().optional(),
      questionsPerLesson: z.number(),
    }),
  },
  output: { schema: LessonSchema },
  model: OPENAI_QUALITY_MODEL,
  prompt: `You are an expert instructional designer building one lesson for an online course.

Course: {{{courseTitle}}} — {{{courseDescription}}}
Module: {{{moduleTitle}}}
Lesson: {{{lessonTitle}}} — {{{lessonTopic}}}
Objectives: {{{learningObjectives}}}
Prior lessons (for continuity): {{{priorLessons}}}
Category: {{{category}}}{{#if codeLanguage}} | Code language: {{{codeLanguage}}}{{/if}}

Instructor brief (context):
{{{brief}}}

Rules:
- Generate exactly {{{questionsPerLesson}}} practice and {{{questionsPerLesson}}} assessment multiple-choice questions (4 options each).
- correctAnswer must exactly match one option string.
- Practical project aligned with the lesson.
- If category is programming, include project.code with starterCode.
- Introduction text: 2–4 paragraphs, engaging.`,
});

const refineAgentFlow = ai.defineFlow(
  {
    name: 'courseRefineAgentFlow',
    inputSchema: RefineInputSchema,
    outputSchema: z.object({
      response: z.string(),
      course: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        image: z.string(),
        category: z.enum(['general', 'programming']).optional(),
        lessons: z.array(LessonSchema),
      }),
    }),
  },
  async (input) => {
    const reviseLesson = ai.defineTool(
      {
        name: 'reviseLesson',
        description:
          'Regenerates or heavily revises a single lesson by id. Use when the instructor wants changes to specific lessons.',
        inputSchema: z.object({
          lessonId: z.string(),
          revisionNotes: z.string(),
        }),
        outputSchema: LessonSchema,
      },
      async ({ lessonId, revisionNotes }) => {
        const lesson = input.course.lessons.find((l) => l.id === lessonId);
        if (!lesson) throw new Error(`Lesson ${lessonId} not found`);
        const { output } = await buildLessonPrompt({
          brief: input.brief || revisionNotes,
          courseTitle: input.course.title,
          courseDescription: input.course.description,
          moduleTitle: 'Course',
          lessonTitle: lesson.title,
          lessonTopic: revisionNotes,
          learningObjectives: revisionNotes,
          priorLessons: input.course.lessons
            .filter((l) => l.id !== lessonId)
            .map((l) => l.title)
            .join(', '),
          category: input.course.category || 'general',
          codeLanguage: lesson.project.code?.language,
          questionsPerLesson: Math.max(
            lesson.practice.questions.length,
            lesson.assessment.questions.length,
            10
          ),
        });
        return output!;
      }
    );

    const llmResponse = await ai.generate({
      model: OPENAI_QUALITY_MODEL,
      tools: [reviseLesson],
      system: `You help instructors refine an existing generated course. When they ask to change specific lessons, use reviseLesson with clear revisionNotes. For title/description changes, explain what you updated in the returned course object conceptually and revise the relevant lessons if needed. Current course has ${input.course.lessons.length} lessons.`,
      prompt: input.instruction,
    });

    let lessons = [...input.course.lessons];
    const toolCalls = llmResponse.toolRequests;
    if (toolCalls?.length) {
      for (const call of toolCalls) {
        if (call.toolRequest.name === 'reviseLesson') {
          const args = call.toolRequest.input as { lessonId: string; revisionNotes: string };
          const updated = await reviseLesson(args);
          lessons = lessons.map((l) => (l.id === args.lessonId ? updated : l));
        }
      }
    }

    return {
      response: llmResponse.text,
      course: { ...input.course, lessons },
    };
  }
);

export async function planCourseOutline(
  input: z.infer<typeof PlanInputSchema>
): Promise<CourseOutline> {
  const options = input.options ?? {};
  const targetLessons = options.lessonCount ?? 6;
  const { output } = await planPrompt({
    brief: input.brief.slice(0, MAX_BRIEF_CHARS),
    sourceType: input.sourceType,
    targetLessons,
    category: options.category ?? 'general',
    difficulty: options.difficulty ?? 'intermediate',
  });
  return output!;
}

export async function buildOutlineLesson(
  input: z.infer<typeof BuildLessonInputSchema>
): Promise<LessonOutput> {
  const flat = flattenOutlineLessons(input.outline);
  const spec = flat.find((l) => l.id === input.lessonId);
  if (!spec) throw new Error(`Lesson ${input.lessonId} not in outline`);

  const prior = flat
    .filter((l) => Number(l.id) < Number(spec.id))
    .map((l) => l.title)
    .join(' → ');

  const { output } = await buildLessonPrompt({
    brief: input.brief.slice(0, MAX_BRIEF_CHARS),
    courseTitle: input.outline.title,
    courseDescription: input.outline.description,
    moduleTitle: spec.moduleTitle,
    lessonTitle: spec.title,
    lessonTopic: spec.topic,
    learningObjectives: spec.learningObjectives.join('; '),
    priorLessons: prior || 'None — first lesson',
    category: input.outline.category,
    codeLanguage: input.outline.codeLanguage,
    questionsPerLesson: input.questionsPerLesson,
  });

  const lesson = output!;
  return { ...lesson, id: spec.id, title: spec.title, duration: spec.duration };
}

export function assembleCourseFromOutline(
  outline: CourseOutline,
  lessons: LessonOutput[]
): Course {
  return {
    id: outline.id,
    title: outline.title,
    description: outline.description,
    image: outline.image,
    category: outline.category,
    lessons: lessons.sort((a, b) => Number(a.id) - Number(b.id)),
  };
}

export async function refineCourseWithAgent(
  input: z.infer<typeof RefineInputSchema>
): Promise<{ response: string; course: Course }> {
  const result = await refineAgentFlow(input);
  return {
    response: result.response,
    course: result.course as Course,
  };
}

/** Run full agentic pipeline (plan + all lessons). */
export async function runCourseArchitectAgent(input: {
  brief: string;
  sourceType?: 'prompt' | 'pdf';
  options?: ArchitectOptions;
  onStep?: (step: AgentStep) => void;
}): Promise<{ course: Course; outline: CourseOutline; steps: AgentStep[]; agentSummary: string }> {
  const steps: AgentStep[] = [
    { id: 'plan', label: 'Architecting course outline', status: 'pending' },
  ];

  const emit = (step: AgentStep) => {
    const idx = steps.findIndex((s) => s.id === step.id);
    if (idx >= 0) steps[idx] = step;
    else steps.push(step);
    input.onStep?.(step);
  };

  emit({ ...steps[0], status: 'running' });
  const outline = await planCourseOutline({
    brief: input.brief,
    sourceType: input.sourceType ?? 'prompt',
    options: input.options,
  });
  const flat = flattenOutlineLessons(outline);
  emit({
    id: 'plan',
    label: 'Architecting course outline',
    status: 'done',
    detail: `${flat.length} lessons across ${outline.modules.length} modules`,
  });

  const qPerLesson = input.options?.questionsPerLesson ?? 12;
  const lessons: LessonOutput[] = [];

  for (const spec of flat) {
    const stepId = `lesson-${spec.id}`;
    emit({ id: stepId, label: `Building lesson ${spec.id}: ${spec.title}`, status: 'running' });
    const lesson = await buildOutlineLesson({
      brief: input.brief,
      outline,
      lessonId: spec.id,
      questionsPerLesson: qPerLesson,
    });
    lessons.push(lesson);
    emit({
      id: stepId,
      label: `Building lesson ${spec.id}: ${spec.title}`,
      status: 'done',
      detail: `${lesson.practice.questions.length} practice + ${lesson.assessment.questions.length} assessment questions`,
    });
  }

  emit({ id: 'assemble', label: 'Assembling course', status: 'running' });
  const course = assembleCourseFromOutline(outline, lessons);
  emit({ id: 'assemble', label: 'Assembling course', status: 'done' });

  return {
    course,
    outline,
    steps,
    agentSummary: outline.agentNotes,
  };
}
