'use server';

/**
 * @fileOverview This file contains a Genkit flow for translating content into a specified language.
 *
 * - translateContent - A function that translates the provided text content.
 * - TranslateContentInput - The input type for the translateContent function.
 * - TranslateContentOutput - The output type for the translateContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateContentInputSchema = z.object({
  text: z.string().describe('The text content to be translated.'),
  language: z.string().describe('The target language for translation.'),
});

export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

const TranslateContentOutputSchema = z.object({
  translatedText: z.string().describe('The translated text content.'),
});

export type TranslateContentOutput = z.infer<typeof TranslateContentOutputSchema>;

export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
  return translateContentFlow(input);
}

const translateContentPrompt = ai.definePrompt({
  name: 'translateContentPrompt',
  input: {schema: TranslateContentInputSchema},
  output: {schema: TranslateContentOutputSchema},
  prompt: `Translate the following text into {{{language}}}:\n\n{{{text}}}`,
});

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async input => {
    const {output} = await translateContentPrompt(input);
    return output!;
  }
);
