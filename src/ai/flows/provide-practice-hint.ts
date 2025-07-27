'use server';

/**
 * @fileOverview Provides a hint for a practice question when the user answers incorrectly.
 *
 * - providePracticeHint - A function that generates a hint for a given question and incorrect answer.
 * - ProvidePracticeHintInput - The input type for the providePracticeHint function.
 * - ProvidePracticeHintOutput - The return type for the providePracticeHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvidePracticeHintInputSchema = z.object({
  question: z.string().describe('The practice question the user is trying to answer.'),
  incorrectAnswer: z.string().describe('The incorrect answer the user provided.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});
export type ProvidePracticeHintInput = z.infer<typeof ProvidePracticeHintInputSchema>;

const ProvidePracticeHintOutputSchema = z.object({
  hint: z
    .string()
    .describe('A helpful hint that guides the user to the correct answer without giving it away directly.'),
});
export type ProvidePracticeHintOutput = z.infer<typeof ProvidePracticeHintOutputSchema>;

export async function providePracticeHint(
  input: ProvidePracticeHintInput
): Promise<ProvidePracticeHintOutput> {
  return providePracticeHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'providePracticeHintPrompt',
  input: {schema: ProvidePracticeHintInputSchema},
  output: {schema: ProvidePracticeHintOutputSchema},
  prompt: `You are an AI learning assistant. A student has answered a practice question incorrectly. Your goal is to provide a helpful hint that nudges them in the right direction without revealing the correct answer. The hint should be plain text, without markdown.

Question: {{{question}}}
Their Incorrect Answer: {{{incorrectAnswer}}}
The Correct Answer is: {{{correctAnswer}}}

Based on this, provide a concise and encouraging hint. For example, if the question is "What color is the sky?" and the user answered "Green", a good hint would be "Think about the color you see on a clear, sunny day."
`,
});

const providePracticeHintFlow = ai.defineFlow(
  {
    name: 'providePracticeHintFlow',
    inputSchema: ProvidePracticeHintInputSchema,
    outputSchema: ProvidePracticeHintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
