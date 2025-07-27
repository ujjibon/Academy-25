'use server';

/**
 * @fileOverview Generates a personalized initial learning plan based on the user's current skill level and learning goals.
 *
 * - generateInitialLearningPlan - A function that generates the learning plan.
 * - GenerateInitialLearningPlanInput - The input type for the generateInitialLearningPlan function.
 * - GenerateInitialLearningPlanOutput - The return type for the generateInitialLearningPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialLearningPlanInputSchema = z.object({
  userSkillLevel: z
    .string()
    .describe('The current skill level of the user (e.g., beginner, intermediate, expert).'),
  userLearningGoals: z
    .string()
    .describe('The learning goals of the user (e.g., learn React, improve design skills).'),
});
export type GenerateInitialLearningPlanInput = z.infer<
  typeof GenerateInitialLearningPlanInputSchema
>;

const GenerateInitialLearningPlanOutputSchema = z.object({
  learningPlan: z
    .string()
    .describe('A personalized initial learning plan based on the user input. This should be a markdown formatted string.'),
});
export type GenerateInitialLearningPlanOutput = z.infer<
  typeof GenerateInitialLearningPlanOutputSchema
>;

export async function generateInitialLearningPlan(
  input: GenerateInitialLearningPlanInput
): Promise<GenerateInitialLearningPlanOutput> {
  return generateInitialLearningPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialLearningPlanPrompt',
  input: {schema: GenerateInitialLearningPlanInputSchema},
  output: {schema: GenerateInitialLearningPlanOutputSchema},
  prompt: `You are an AI learning assistant. Generate a personalized, step-by-step initial learning plan for the user based on their current skill level and learning goals. The plan should be concise, actionable, and encouraging. Format the output as a markdown string, using bold titles for sections and bullet points for steps.

Current Skill Level: {{{userSkillLevel}}}
Learning Goals: {{{userLearningGoals}}}

Learning Plan:
`,
});

const generateInitialLearningPlanFlow = ai.defineFlow(
  {
    name: 'generateInitialLearningPlanFlow',
    inputSchema: GenerateInitialLearningPlanInputSchema,
    outputSchema: GenerateInitialLearningPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
