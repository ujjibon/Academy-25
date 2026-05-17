'use server';

/**
 * @fileOverview Quick teaching flow optimized for fast, focused responses
 */

import { fastAI } from '@/ai/genkit';
import { z } from 'genkit';

const QuickTeachingInputSchema = z.object({
  topic: z.string().describe("The specific topic the student wants to learn about."),
  currentLesson: z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number(),
    introduction: z.object({
      text: z.string(),
    }),
  }).describe('The current lesson context.'),
  courseContext: z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
        id: z.string(),
        title: z.string(),
        duration: z.number(),
    }))
  }).describe('The course context.'),
  learningLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('The student\'s current learning level.'),
  specificQuestion: z.string().optional().describe('A specific question the student has about the topic.'),
});

export type QuickTeachingInput = z.infer<typeof QuickTeachingInputSchema>;

const QuickTeachingOutputSchema = z.object({
  teachingContent: z.string().describe('Focused teaching content for the topic.'),
  keyPoints: z.array(z.string()).describe('3-5 key points to remember.'),
  example: z.string().describe('One practical example.'),
  nextStep: z.string().describe('Suggested next step.'),
});

export type QuickTeachingOutput = z.infer<typeof QuickTeachingOutputSchema>;

const quickTeachingPrompt = fastAI.definePrompt({
  name: 'quickTeachingPrompt',
  input: { schema: QuickTeachingInputSchema },
  output: { schema: QuickTeachingOutputSchema },
  prompt: `You are a fast, effective AI teacher. Give focused, practical explanations.

Topic: {{topic}}
Lesson: {{currentLesson.title}}
Course: {{courseContext.title}}
Level: {{learningLevel}}
Question: {{specificQuestion}}

Give a concise explanation (max 300 words) with:
1. Clear explanation of the topic
2. 3-5 key points to remember
3. One practical example
4. Next step suggestion

Be direct and helpful. Focus on understanding, not comprehensive coverage.`,
});

const quickTeachingFlow = fastAI.defineFlow(
  {
    name: 'quickTeachingFlow',
    inputSchema: QuickTeachingInputSchema,
    outputSchema: QuickTeachingOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await quickTeachingPrompt(input);
      return output!;
    } catch (error) {
      console.error('Quick teaching error:', error);
      // Fallback response
      return {
        teachingContent: `I'll help you understand ${input.topic}. This is an important concept in ${input.courseContext.title}.`,
        keyPoints: [
          'Focus on understanding the basics first',
          'Practice with examples',
          'Ask questions when you need clarification'
        ],
        example: 'Let me provide a simple example to illustrate this concept.',
        nextStep: 'Try practicing with a simple exercise to reinforce your understanding.',
      };
    }
  }
);

export async function quickTeaching(input: QuickTeachingInput): Promise<QuickTeachingOutput> {
  return quickTeachingFlow(input);
}
