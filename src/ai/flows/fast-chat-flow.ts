'use server';

/**
 * @fileOverview Fast chat flow optimized for quick responses with caching and fallbacks
 */

import { fastAI } from '@/ai/genkit';
import { z } from 'genkit';

const FastChatInputSchema = z.object({
  question: z.string().describe('The user\'s question or message.'),
  history: z
    .array(z.object({user: z.string(), model: z.string()}))
    .optional()
    .describe('The history of the conversation.'),
  context: z.object({
    course: z.string().optional(),
    lesson: z.string().optional(),
    role: z.enum(['learner', 'instructor']).optional(),
  }).optional().describe('Learning or teaching context.'),
});

export type FastChatInput = z.infer<typeof FastChatInputSchema>;

const FastChatOutputSchema = z.object({
  answer: z.string().describe('The AI\'s response to the user\'s question.'),
  isQuickResponse: z.boolean().describe('Whether this was a quick cached/fallback response.'),
});

export type FastChatOutput = z.infer<typeof FastChatOutputSchema>;

// Quick response cache for common questions
const quickResponses = new Map([
  ['hello', 'Hello! I\'m here to help you learn. What would you like to know?'],
  ['hi', 'Hi there! Ready to learn something new today?'],
  ['help', 'I can help you with your courses, explain concepts, provide examples, and guide your learning. What do you need help with?'],
  ['what can you do', 'I can explain course topics, provide examples, answer questions, give practice exercises, and help you understand complex concepts. Just ask me anything!'],
  ['how are you', 'I\'m doing great and ready to help you learn! What would you like to explore today?'],
  ['thanks', 'You\'re welcome! Happy to help. Is there anything else you\'d like to learn?'],
  ['thank you', 'You\'re very welcome! Feel free to ask me anything else.'],
]);

// Common learning patterns for quick responses
const learningPatterns = [
  { pattern: /what is (.+)/i, response: 'Let me explain {topic} briefly: ' },
  { pattern: /explain (.+)/i, response: 'I\'ll explain {topic} in simple terms: ' },
  { pattern: /how does (.+) work/i, response: 'Here\'s how {topic} works: ' },
  { pattern: /give me an example of (.+)/i, response: 'Here\'s a great example of {topic}: ' },
  { pattern: /show me (.+)/i, response: 'Let me show you {topic}: ' },
];

const fastChatPrompt = fastAI.definePrompt({
  name: 'fastChatPrompt',
  input: { schema: FastChatInputSchema },
  output: { schema: FastChatOutputSchema },
  prompt: `You are a fast, helpful AI assistant for Peer Academy.
{{#if context.role}}
The user role is "{{context.role}}". If instructor: focus on teaching — lesson plans, assignments, rubrics, grading feedback, course and bootcamp design, classroom management, and student engagement. If learner: focus on learning support, explanations, and study guidance.
{{else}}
Focus on learning support unless the question is clearly about teaching.
{{/if}}

Context: {{#if context.course}}Course: {{context.course}}{{/if}}{{#if context.lesson}} | Lesson: {{context.lesson}}{{/if}}

{{#if history}}
Recent conversation:
{{#each history}}
User: {{{this.user}}}
AI: {{{this.model}}}
{{/each}}
{{/if}}

User question: {{{question}}}

Give a helpful, concise answer (max 200 words). Focus on being clear and practical.`,
});

const fastChatFlow = fastAI.defineFlow(
  {
    name: 'fastChatFlow',
    inputSchema: FastChatInputSchema,
    outputSchema: FastChatOutputSchema,
  },
  async (input) => {
    const { question } = input;
    const lowerQuestion = question.toLowerCase().trim();

    // Check for quick responses first
    if (quickResponses.has(lowerQuestion)) {
      return {
        answer: quickResponses.get(lowerQuestion)!,
        isQuickResponse: true,
      };
    }

    // Check for learning patterns
    for (const { pattern, response } of learningPatterns) {
      const match = question.match(pattern);
      if (match) {
        const topic = match[1];
        const quickAnswer = response.replace('{topic}', topic);
        
        // For simple questions, provide a quick response
        if (question.length < 50) {
          return {
            answer: `${quickAnswer}This is a fundamental concept. Would you like me to explain it in more detail?`,
            isQuickResponse: true,
          };
        }
      }
    }

    // Use AI for more complex questions
    try {
      const { output } = await fastChatPrompt(input);
      return {
        answer: output!.answer,
        isQuickResponse: false,
      };
    } catch (error) {
      console.error('Fast chat error:', error);
      return {
        answer: 'I\'m having trouble processing that right now. Could you try rephrasing your question?',
        isQuickResponse: true,
      };
    }
  }
);

export async function fastChat(input: FastChatInput): Promise<FastChatOutput> {
  return fastChatFlow(input);
}
