
'use server';

/**
 * @fileOverview Interactive agent for lesson-by-lesson course building with tools.
 */

import { ai, OPENAI_QUALITY_MODEL } from '@/ai/genkit';
import { z } from 'genkit';
import { LessonSchema, type LessonOutput } from '@/ai/flows/course-lesson-schema';

const generateLessonContent = ai.defineTool(
  {
    name: 'generateLessonContent',
    description:
      'Generates complete lesson content (introduction, practice, project, assessment) for a specific topic.',
    inputSchema: z.object({
      lessonTopic: z.string(),
      lessonId: z.string().optional(),
      courseContext: z.string().optional(),
    }),
    outputSchema: LessonSchema,
  },
  async (input) => {
    const lessonPrompt = ai.definePrompt({
      name: 'lessonGeneratorPrompt',
      input: {
        schema: z.object({
          lessonTopic: z.string(),
          lessonId: z.string(),
          courseContext: z.string(),
        }),
      },
      output: { schema: LessonSchema },
      model: OPENAI_QUALITY_MODEL,
      prompt: `You are an expert instructional designer.

Course context: {{{courseContext}}}
Lesson topic: {{{lessonTopic}}}
Lesson id: {{{lessonId}}}

Generate a complete lesson. At least 8 practice and 8 assessment MCQs (4 options; correctAnswer must match an option).
Include a practical project. Use engaging introduction text.`,
    });

    const { output } = await lessonPrompt({
      lessonTopic: input.lessonTopic,
      lessonId: input.lessonId || '1',
      courseContext: input.courseContext || 'General course',
    });
    return output!;
  }
);

const planNextLesson = ai.defineTool(
  {
    name: 'planNextLesson',
    description:
      'Suggests the next lesson title and topic based on course progress. Use when building a multi-lesson course step by step.',
    inputSchema: z.object({
      courseTopic: z.string(),
      completedLessons: z.array(z.string()).describe('Titles of lessons already created'),
    }),
    outputSchema: z.object({
      suggestedTitle: z.string(),
      suggestedTopic: z.string(),
      rationale: z.string(),
    }),
  },
  async (input) => {
    const planPrompt = ai.definePrompt({
      name: 'planNextLessonPrompt',
      input: { schema: z.object({ courseTopic: z.string(), completed: z.string() }) },
      output: {
        schema: z.object({
          suggestedTitle: z.string(),
          suggestedTopic: z.string(),
          rationale: z.string(),
        }),
      },
      prompt: `Course: {{{courseTopic}}}
Completed lessons: {{{completed}}}
Suggest the next lesson title, focus topic, and one-sentence rationale.`,
    });
    const { output } = await planPrompt({
      courseTopic: input.courseTopic,
      completed: input.completedLessons.join(', ') || 'None yet',
    });
    return output!;
  }
);

const CreatorAgentInputSchema = z.object({
  instruction: z.string(),
  history: z.any().optional(),
  courseContext: z.string().optional(),
});
export type CreatorAgentInput = z.infer<typeof CreatorAgentInputSchema>;

const CreatorAgentOutputSchema = z.object({
  response: z.string(),
  generatedLesson: LessonSchema.optional(),
  suggestedNextLesson: z
    .object({
      suggestedTitle: z.string(),
      suggestedTopic: z.string(),
      rationale: z.string(),
    })
    .optional(),
});
export type CreatorAgentOutput = z.infer<typeof CreatorAgentOutputSchema>;

const TOOLS = [generateLessonContent, planNextLesson];

async function executeToolCalls(
  toolCalls: { toolRequest: { name: string; input: unknown } }[]
): Promise<{
  generatedLesson?: LessonOutput;
  suggestedNextLesson?: CreatorAgentOutput['suggestedNextLesson'];
}> {
  let generatedLesson: LessonOutput | undefined;
  let suggestedNextLesson: CreatorAgentOutput['suggestedNextLesson'];

  for (const call of toolCalls) {
    const { name, input } = call.toolRequest;
    if (name === 'generateLessonContent') {
      generatedLesson = await generateLessonContent(
        input as { lessonTopic: string; lessonId?: string; courseContext?: string }
      );
    }
    if (name === 'planNextLesson') {
      suggestedNextLesson = await planNextLesson(
        input as { courseTopic: string; completedLessons: string[] }
      );
    }
  }

  return { generatedLesson, suggestedNextLesson };
}

const courseCreatorAgentFlow = ai.defineFlow(
  {
    name: 'courseCreatorAgentFlow',
    inputSchema: CreatorAgentInputSchema,
    outputSchema: CreatorAgentOutputSchema,
  },
  async (input) => {
    const { history, instruction, courseContext } = input;

    const llmResponse = await ai.generate({
      model: OPENAI_QUALITY_MODEL,
      prompt: [
        {
          text: instruction,
          metadata: history ? { history } : undefined,
        },
      ],
      tools: TOOLS,
      system: `You are an AI Academic Co-pilot helping instructors build courses lesson by lesson.

- Use generateLessonContent when they ask to create or rewrite a lesson. Confirm first, then call the tool.
- Use planNextLesson when they are building a series and need what comes next.
- If they paste a full syllabus, acknowledge it and start with the first lesson via generateLessonContent.
- If vague ("do it"), pick a strong default topic and generate lesson 1.
- Remind them content appears in the editor panel on the right.
- Be concise and actionable.${courseContext ? `\nCourse context: ${courseContext}` : ''}`,
    });

    const output: CreatorAgentOutput = { response: llmResponse.text };
    const toolCalls = llmResponse.toolRequests;

    if (toolCalls?.length) {
      const results = await executeToolCalls(toolCalls);
      if (results.generatedLesson) output.generatedLesson = results.generatedLesson;
      if (results.suggestedNextLesson) output.suggestedNextLesson = results.suggestedNextLesson;
    }

    return output;
  }
);

export async function courseCreatorAgent(input: CreatorAgentInput): Promise<CreatorAgentOutput> {
  return courseCreatorAgentFlow(input);
}
