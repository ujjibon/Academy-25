'use server';

/**
 * @fileOverview A flow for evaluating submitted tasks and providing feedback.
 *
 * - evaluateSubmittedTask - A function that evaluates the submitted task.
 * - EvaluateSubmittedTaskInput - The input type for the evaluateSubmittedTask function.
 * - EvaluateSubmittedTaskOutput - The return type for the evaluateSubmittedTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateSubmittedTaskInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the task that was assigned.'),
  submissionText: z.string().optional().describe('The student submission text for the task.'),
  submissionFile: z
    .string()
    .optional()
    .describe(
      "The student's submitted file (e.g., PDF, DOC, JPG) as a data URI." +
      " Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  studentLevel: z
    .string()
    .describe(
      'The level of the student (e.g., beginner, intermediate, advanced).' +
        'This helps tailor the feedback and scoring appropriately.'
    ),
  feedbackRequest: z
    .string()
    .optional()
    .describe(
      'Any specific feedback the student is looking for. ' +
        'This should be incorporated into the overall evaluation.'
    ),
});
export type EvaluateSubmittedTaskInput = z.infer<
  typeof EvaluateSubmittedTaskInputSchema
>;

const EvaluateSubmittedTaskOutputSchema = z.object({
  score: z
    .number()
    .describe('The score of the submission (out of 100).')
    .min(0)
    .max(100),
  feedback: z.string().describe('The feedback for the submission.'),
  suggestions: z.string().describe('Suggestions for improvement.'),
  improvementPaths: z.string().describe('Possible paths for improvement.'),
  summaryOfMistakes: z
    .string()
    .describe('A summary of the mistakes made in the submission.'),
});
export type EvaluateSubmittedTaskOutput = z.infer<
  typeof EvaluateSubmittedTaskOutputSchema
>;

export async function evaluateSubmittedTask(
  input: EvaluateSubmittedTaskInput
): Promise<EvaluateSubmittedTaskOutput> {
  return evaluateSubmittedTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateSubmittedTaskPrompt',
  input: {schema: EvaluateSubmittedTaskInputSchema},
  output: {schema: EvaluateSubmittedTaskOutputSchema},
  prompt: `You are an expert AI evaluation engine. Your purpose is to analyze student submissions and provide professional, insightful, and constructive feedback. You must act as a specialist in the subject matter of the task.

  **Your Evaluation Context:**
  - **Task Description:** {{{taskDescription}}}
  - **Student Level:** {{{studentLevel}}}
  {{#if feedbackRequest}}
  - **Specific Feedback Request:** {{{feedbackRequest}}}
  {{/if}}

  **Student's Submission:**
  {{#if submissionText}}
  - **Text submission:**
    {{{submissionText}}}
  {{/if}}

  {{#if submissionFile}}
  - **File submission (analyze the content of this file):**
    {{media url=submissionFile}}
  {{/if}}

  **Your Task:**
  Carefully analyze the submission based on the provided context. Your feedback must be professional, well-structured, and encouraging.

  1.  **Analyze the Submission:**
      - If it's a document (PDF, DOCX), analyze its structure, formatting, clarity, tone, and content. Check for professionalism and whether it meets the task requirements.
      - If it's a design (PNG, JPG), evaluate its layout, visual hierarchy, color scheme, typography, and overall effectiveness.
      - If it's data (like from a spreadsheet), check for accuracy, clarity of presentation, and the insights drawn from it.

  2.  **Generate Structured Feedback:** Provide your response in markdown format with the following sections:
      - **Score:** Give a score out of 100, reflecting the quality of the work in relation to the student's level and task requirements.
      - **Feedback:** Provide specific, constructive feedback. Start with positive reinforcement before discussing areas for improvement. Be detailed in your analysis.
      - **Summary of Mistakes:** Clearly and gently point out any errors or areas where the submission missed the mark.
      - **Suggestions for Improvement:** Offer concrete, actionable suggestions. For example, instead of "improve the layout," say "try aligning the left edges of the text boxes and increasing the font size of the main title."
      - **Improvement Paths:** Suggest what the student could learn or practice next to enhance their skills in this area.

  Your tone should always be that of a supportive and knowledgeable mentor.`,
});

const evaluateSubmittedTaskFlow = ai.defineFlow(
  {
    name: 'evaluateSubmittedTaskFlow',
    inputSchema: EvaluateSubmittedTaskInputSchema,
    outputSchema: EvaluateSubmittedTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
