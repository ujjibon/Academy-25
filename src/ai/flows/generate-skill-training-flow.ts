'use server';

/**
 * Generates a full professional training program from a skill name.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TrainingModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  topics: z.array(z.string()).min(3),
  exercises: z.array(z.string()).min(2),
  durationHours: z.number(),
});

const GenerateSkillTrainingInputSchema = z.object({
  skill: z.string().describe('The skill to train (e.g. React, Public Speaking, Data Analysis).'),
  skillLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('Current proficiency level.'),
  goals: z.string().optional().describe('Optional learning goals or job context.'),
});

export type GenerateSkillTrainingInput = z.infer<typeof GenerateSkillTrainingInputSchema>;

const GenerateSkillTrainingOutputSchema = z.object({
  id: z.string().describe('URL-friendly id slug from the skill name.'),
  skill: z.string(),
  title: z.string().describe('Professional training program title.'),
  summary: z.string().describe('Executive summary of the program (2-3 sentences).'),
  durationWeeks: z.number().describe('Recommended program length in weeks.'),
  objectives: z.array(z.string()).min(4).describe('Learning objectives.'),
  modules: z.array(TrainingModuleSchema).min(4).describe('Structured training modules.'),
  capstoneProject: z.object({
    title: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()).min(2),
  }),
  assessmentCriteria: z.array(z.string()).min(3),
  recommendedResources: z.array(z.string()).min(3),
  weeklySchedule: z.array(z.string()).min(4).describe('Week-by-week schedule bullets.'),
  completionSummary: z
    .string()
    .describe('Short paragraph for certificate of completion (formal tone).'),
});

export type GenerateSkillTrainingOutput = z.infer<typeof GenerateSkillTrainingOutputSchema>;

export async function generateSkillTraining(
  input: GenerateSkillTrainingInput
): Promise<GenerateSkillTrainingOutput> {
  return generateSkillTrainingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSkillTrainingPrompt',
  input: { schema: GenerateSkillTrainingInputSchema },
  output: { schema: GenerateSkillTrainingOutputSchema },
  prompt: `You are a senior corporate L&D (Learning & Development) instructional designer. Create a complete, production-ready professional training program for the skill below. The program should be suitable for corporate upskilling, bootcamps, or self-paced professional development.

**Skill:** {{{skill}}}
**Learner level:** {{{skillLevel}}}
{{#if goals}}**Goals / context:** {{{goals}}}{{/if}}

**Requirements:**
1. Title should sound professional (e.g. "Professional React Development Training Program").
2. Include at least 4 modules that progress logically from foundations to advanced application.
3. Each module needs concrete topics, hands-on exercises, and realistic duration in hours.
4. Capstone project must demonstrate mastery of the skill in a real-world scenario.
5. Weekly schedule should map modules across the durationWeeks timeline.
6. completionSummary: 2-3 formal sentences suitable for printing on a certificate of completion.
7. id: lowercase slug with hyphens only (e.g. "react-development").
`,
});

const generateSkillTrainingFlow = ai.defineFlow(
  {
    name: 'generateSkillTrainingFlow',
    inputSchema: GenerateSkillTrainingInputSchema,
    outputSchema: GenerateSkillTrainingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
