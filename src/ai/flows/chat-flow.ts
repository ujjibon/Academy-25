'use server';

/**
 * @fileOverview A flow for a general-purpose learning assistant chatbot.
 *
 * - chat - A function that handles the chat conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  question: z.string().describe('The user\'s question or message.'),
  history: z
    .array(z.object({user: z.string(), model: z.string()}))
    .optional()
    .describe('The history of the conversation.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string().describe('The AI\'s response to the user.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  prompt: `You are SkillSprint AI, a friendly and helpful AI learning assistant.
  Your goal is to help users learn new skills and answer their questions about their courses, code, and learning journey.
  Keep your answers concise and encouraging.
  Use markdown for formatting, like bold titles and bullet points, to make the information clear and easy to read.

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

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
