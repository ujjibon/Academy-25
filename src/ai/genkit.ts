import {genkit} from 'genkit';
import openAI from '@genkit-ai/compat-oai/openai';

/** Resolves OpenAI API key from env (standard name used across the project). */
export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

const openAiPlugin = openAI({apiKey: getOpenAIApiKey()});

export const OPENAI_DEFAULT_MODEL = 'openai/gpt-4o-mini';
export const OPENAI_QUALITY_MODEL = 'openai/gpt-4o';

export const ai = genkit({
  plugins: [openAiPlugin],
  model: OPENAI_DEFAULT_MODEL,
});

// Fast AI configuration for quick responses
export const fastAI = genkit({
  plugins: [openAiPlugin],
  model: OPENAI_DEFAULT_MODEL,
});

// OpenAI API configuration for direct chat/completions calls (e.g. visuals)
export const openAIConfig = {
  apiKey: getOpenAIApiKey(),
  apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  config: {
    temperature: 0.7,
    max_tokens: 4000,
    top_p: 0.9,
  },
};

/** @deprecated Use openAIConfig — kept for imports that still reference the old name */
export const deepSeekConfig = openAIConfig;
