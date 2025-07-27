'use server';

/**
 * @fileOverview A flow for a course-specific AI tutor.
 *
 * - courseTutor - A function that handles the chat conversation with the AI tutor.
 * - CourseTutorInput - The input type for the courseTutor function.
 * - CourseTutorOutput - The return type for the courseTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CourseTutorInputSchema = z.object({
  question: z.string().describe("The user's question or message."),
  fileDataUri: z
    .string()
    .optional()
    .describe(
      "An optional file (e.g., PDF, DOC, JPG) as a data URI that the user has uploaded for context." +
      " Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  courseContext: z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
        id: z.string(),
        title: z.string(),
        duration: z.number(),
    }))
  }).describe('The context of the course the user is asking about.'),
  history: z
    .array(z.object({user: z.string(), model: z.string()}))
    .optional()
    .describe('The history of the conversation.'),
  userPreferences: z.object({
    learningStyle: z.string().optional().describe("The user's preferred learning style (e.g., 'visual', 'practical', 'auditory')."),
  }).optional().describe('User-specific learning preferences.'),
});
export type CourseTutorInput = z.infer<typeof CourseTutorInputSchema>;

const CourseTutorOutputSchema = z.object({
  answer: z.string().describe('The AI tutor\'s response to the user.'),
});
export type CourseTutorOutput = z.infer<typeof CourseTutorOutputSchema>;

export async function courseTutor(input: CourseTutorInput): Promise<CourseTutorOutput> {
  return courseTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'courseTutorPrompt',
  input: {schema: CourseTutorInputSchema},
  output: {schema: CourseTutorOutputSchema},
  prompt: `You are an expert AI Teacher for a specific course. Your goal is to help students understand the course material, answer their questions, and provide explanations.
  You are an expert in "{{courseContext.title}}".
  Use markdown for formatting, such as bold titles for key concepts and bullet points for lists, to make your explanations clear and well-structured.

  Here is the course context:
  Title: {{courseContext.title}}
  Description: {{courseContext.description}}
  Lessons:
  {{#each courseContext.lessons}}
  - {{this.title}} ({{this.duration}} mins)
  {{/each}}

  {{#if userPreferences}}
  Consider the user's learning preferences:
  {{#if userPreferences.learningStyle}}
  - Learning Style: {{userPreferences.learningStyle}}. Adapt your explanation to be more {{userPreferences.learningStyle}}. For example, if they are a visual learner, suggest diagrams or visual aids. If they are practical, provide real-world examples.
  {{/if}}
  {{/if}}

  {{#if fileDataUri}}
  The user has also uploaded a file. Use the content of this file as the primary context for their question. Analyze the file and answer the user's question about it.
  File for analysis: {{media url=fileDataUri}}
  {{/if}}

  Use this context to answer the user's questions. Be encouraging and clear in your explanations.
  If a question is outside the scope of this course, gently guide the user back to the course material.

  Here is the conversation history (user messages and your previous responses):
  {{#if history}}
  {{#each history}}
  User: {{{this.user}}}
  AI: {{{this.model}}}
  {{/each}}
  {{/if}}

  New user question: {{{question}}}
  Your answer:`,
});

const courseTutorFlow = ai.defineFlow(
  {
    name: 'courseTutorFlow',
    inputSchema: CourseTutorInputSchema,
    outputSchema: CourseTutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
