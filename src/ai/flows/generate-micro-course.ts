'use server';

/**
 * @fileOverview A flow for generating a micro-course from a user-provided topic.
 *
 * - generateMicroCourse - A function that generates a one-page course structure.
 * - GenerateMicroCourseInput - The input type for the function.
 * - GenerateMicroCourseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMicroCourseInputSchema = z.object({
  topic: z
    .string()
    .describe('The topic the user wants to teach. e.g., "React Components" or "CSS Flexbox".'),
});
export type GenerateMicroCourseInput = z.infer<
  typeof GenerateMicroCourseInputSchema
>;

const GenerateMicroCourseOutputSchema = z.object({
  title: z.string().describe('A catchy title for the micro-course.'),
  introduction: z
    .string()
    .describe('A brief, engaging introduction to the topic.'),
  keyConcepts: z
    .array(z.object({
        concept: z.string().describe("The name of the key concept."),
        description: z.string().describe("A concise explanation of the concept.")
    }))
    .describe('A list of 2-3 key concepts that are fundamental to understanding the topic.'),
  challenge: z.object({
    title: z.string().describe("A title for the hands-on challenge."),
    description: z.string().describe("A short, practical challenge or project for a learner to complete.")
  }).describe('A simple, hands-on challenge to apply the learned concepts.'),
});
export type GenerateMicroCourseOutput = z.infer<
  typeof GenerateMicroCourseOutputSchema
>;

export async function generateMicroCourse(
  input: GenerateMicroCourseInput
): Promise<GenerateMicroCourseOutput> {
  return generateMicroCourseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMicroCoursePrompt',
  input: {schema: GenerateMicroCourseInputSchema},
  output: {schema: GenerateMicroCourseOutputSchema},
  prompt: `You are an expert Instructional Designer AI. Your task is to help a user create a simple, one-page micro-course about a topic they have learned.
  The course should be concise, practical, and easy for a beginner to understand.

  The user wants to create a course about: {{{topic}}}

  Based on this topic, please generate the following structured content:
  1.  **Title**: A catchy and clear title for the micro-course.
  2.  **Introduction**: A short, one-paragraph introduction that explains what the topic is and why it's important.
  3.  **Key Concepts**: Identify the 2 or 3 most important concepts a beginner needs to know. For each concept, provide a name and a simple, one-sentence explanation.
  4.  **Hands-On Challenge**: Create a small, practical project or challenge that allows a learner to apply these concepts. Provide a title and a clear description for this challenge.

  Your output must be structured according to the output schema.`,
});

const generateMicroCourseFlow = ai.defineFlow(
  {
    name: 'generateMicroCourseFlow',
    inputSchema: GenerateMicroCourseInputSchema,
    outputSchema: GenerateMicroCourseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
