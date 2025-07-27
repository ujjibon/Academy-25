'use server';

/**
 * @fileOverview AI flow to provide smart feedback on student submissions.
 *
 * - provideSmartFeedback - A function that provides feedback on student work.
 * - ProvideSmartFeedbackInput - The input type for the provideSmartFeedback function.
 * - ProvideSmartFeedbackOutput - The return type for the provideSmartFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideSmartFeedbackInputSchema = z.object({
  submission: z.string().describe('The student submission (answer, project, or essay).'),
  materialType: z
    .enum(['answer', 'project', 'essay'])
    .describe('The type of material submitted.'),
  topic: z.string().describe('The topic of the submission.'),
});
export type ProvideSmartFeedbackInput = z.infer<typeof ProvideSmartFeedbackInputSchema>;

const ProvideSmartFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Feedback on the submission.'),
  summaryOfMistakes: z.string().describe('A summary of the mistakes made.'),
  suggestedNextSteps: z.string().describe('Suggested next steps for the student.'),
});
export type ProvideSmartFeedbackOutput = z.infer<typeof ProvideSmartFeedbackOutputSchema>;

export async function provideSmartFeedback(
  input: ProvideSmartFeedbackInput
): Promise<ProvideSmartFeedbackOutput> {
  return provideSmartFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideSmartFeedbackPrompt',
  input: {schema: ProvideSmartFeedbackInputSchema},
  output: {schema: ProvideSmartFeedbackOutputSchema},
  prompt: `You are an AI assistant providing feedback to students.

  You will receive a student's submission, the type of material submitted, and the topic of the submission.
  You will provide feedback on the submission, summarize the mistakes made, and suggest next steps for the student.

  Submission Type: {{{materialType}}}
  Topic: {{{topic}}}
  Submission: {{{submission}}}

  Ensure that the feedback, summary of mistakes, and suggested next steps are tailored to the specific material type and topic.
  Use markdown for formatting. Use bold titles for sections and bullet points for lists to make the feedback clear and structured.
`,
});

const provideSmartFeedbackFlow = ai.defineFlow(
  {
    name: 'provideSmartFeedbackFlow',
    inputSchema: ProvideSmartFeedbackInputSchema,
    outputSchema: ProvideSmartFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
