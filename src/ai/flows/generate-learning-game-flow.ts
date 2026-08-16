'use server';

/**
 * Generates an interactive learning mini-game from course topics.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateLearningGameInputSchema,
  GenerateLearningGameOutputSchema,
  type GenerateLearningGameInput,
  type GenerateLearningGameOutput,
} from '@/lib/learning-games';

export type { GenerateLearningGameInput, GenerateLearningGameOutput };

export async function generateLearningGame(
  input: GenerateLearningGameInput
): Promise<GenerateLearningGameOutput> {
  return generateLearningGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningGamePrompt',
  input: { schema: GenerateLearningGameInputSchema },
  output: { schema: GenerateLearningGameOutputSchema },
  prompt: `You are a playful learning-game designer. Create ONE fun, accurate mini-game that helps learners practice concepts from this course.

**Course:** {{{courseTitle}}}
**About:** {{{courseDescription}}}
**Lessons:** {{#each lessonTitles}}{{{this}}}{{#unless @last}}; {{/unless}}{{/each}}
{{#if topicFocus}}**Focus topic:** {{{topicFocus}}}{{/if}}
**Game type:** {{{gameType}}}
**Difficulty:** {{{difficulty}}}

**Rules:**
1. Content must be factually tied to the course topics — no generic filler.
2. Tone: encouraging, light, game-like (not exam-like).
3. title + tagline should feel fun (e.g. "Prompt Relay", "Figma Frenzy").
4. Only populate the arrays for the requested gameType; set all other arrays to [].
5. For quiz-blitz / scenario / fill-gap: correctAnswer / correctOption / answer MUST exactly match one option string.
6. For fill-gap: sentence must contain exactly one blank as ____ .
7. For speed-sort: every sortItem.correctBucketId must match a sortBuckets.id.
8. For true-or-twist: mix true and false statements; explanations teach the right idea.
9. estimatedMinutes: 3–12. xpReward: 25–80 (harder = higher).
10. Make distractors plausible so the game is challenging but fair.
`,
});

const generateLearningGameFlow = ai.defineFlow(
  {
    name: 'generateLearningGameFlow',
    inputSchema: GenerateLearningGameInputSchema,
    outputSchema: GenerateLearningGameOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
