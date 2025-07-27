'use server';

/**
 * @fileOverview A flow for generating a dynamic, personalized suggestion for the user's dashboard.
 *
 * - generateDashboardSuggestion - A function that generates a personalized suggestion.
 * - GenerateDashboardSuggestionInput - The input type for the function.
 * - GenerateDashboardSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDashboardSuggestionInputSchema = z.object({
  activeCourse: z.string().describe("The user's currently active course."),
  strengths: z.array(z.string()).describe("The user's current strengths."),
  weaknesses: z.array(z.string()).describe("The user's current weaknesses."),
});
export type GenerateDashboardSuggestionInput = z.infer<
  typeof GenerateDashboardSuggestionInputSchema
>;

const GenerateDashboardSuggestionOutputSchema = z.object({
  suggestion: z
    .string()
    .describe('A short, actionable, and encouraging suggestion for the user. It should be 1-2 sentences long and can use markdown for formatting.'),
});
export type GenerateDashboardSuggestionOutput = z.infer<
  typeof GenerateDashboardSuggestionOutputSchema
>;

export async function generateDashboardSuggestion(
  input: GenerateDashboardSuggestionInput
): Promise<GenerateDashboardSuggestionOutput> {
  return generateDashboardSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDashboardSuggestionPrompt',
  input: {schema: GenerateDashboardSuggestionInputSchema},
  output: {schema: GenerateDashboardSuggestionOutputSchema},
  prompt: `You are an AI Personal Coach. Your goal is to keep students motivated and on track.
  Based on the user's current learning context, provide a single, short, actionable, and encouraging suggestion.
  Keep it concise and friendly. Use markdown for emphasis if needed (e.g., bolding a key term).

  User's Current Context:
  - Active Course: {{{activeCourse}}}
  - Strengths: {{#each strengths}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Weaknesses: {{#each weaknesses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Example Suggestions:
  - "You're doing great in **React**! Why not try the 'Components and Props' project to solidify your skills?"
  - "I noticed you're finding **State Management** a bit tricky. How about we review the 'State Management' lesson today?"
  - "You've been consistent this week! Let's keep the momentum going with the next lesson in **Advanced CSS**."

  Generate a new suggestion now.`,
});

const generateDashboardSuggestionFlow = ai.defineFlow(
  {
    name: 'generateDashboardSuggestionFlow',
    inputSchema: GenerateDashboardSuggestionInputSchema,
    outputSchema: GenerateDashboardSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
