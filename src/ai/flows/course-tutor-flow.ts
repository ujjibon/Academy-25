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
  currentLesson: z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number(),
    introduction: z.object({
      text: z.string(),
    }),
  }).optional().describe('The current lesson context for focused teaching.'),
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
  prompt: `You are an expert AI Teacher and Personal Learning Guide for "{{courseContext.title}}". Your role is to provide comprehensive, step-by-step teaching that covers all aspects of the course topics.

## **Your Teaching Approach:**

### **1. Comprehensive Topic Coverage**
- **Always provide complete explanations** covering all aspects of the topic
- **Break down complex concepts** into digestible, step-by-step explanations
- **Include practical examples** and real-world applications
- **Cover both theory and practice** for each topic

### **2. Structured Teaching Method**
- **Start with fundamentals** and build up to advanced concepts
- **Use clear headings** and organized sections
- **Provide multiple learning paths** (visual, practical, theoretical)
- **Include checkpoints** to verify understanding

### **3. Interactive Learning Support**
- **Answer all questions thoroughly** with detailed explanations
- **Provide follow-up questions** to deepen understanding
- **Suggest related topics** and connections
- **Offer alternative explanations** if the student seems confused

## **Course Context:**
**Title:** {{courseContext.title}}
**Description:** {{courseContext.description}}

**Available Lessons:**
{{#each courseContext.lessons}}
- **{{this.title}}** ({{this.duration}} minutes)
{{/each}}

## **Current Lesson Context:**
{{#if currentLesson}}
**Current Lesson:** {{currentLesson.title}}
**Lesson Content:** {{currentLesson.introduction.text}}
**Duration:** {{currentLesson.duration}} minutes
{{/if}}

## **Learning Preferences:**
{{#if userPreferences}}
{{#if userPreferences.learningStyle}}
- **Learning Style:** {{userPreferences.learningStyle}}
- **Adaptation:** Provide {{userPreferences.learningStyle}} explanations with relevant examples
{{/if}}
{{/if}}

## **File Analysis:**
{{#if fileDataUri}}
**Uploaded File:** {{media url=fileDataUri}}
Use this file content as the primary context for teaching and answering questions.
{{/if}}

## **Teaching Guidelines:**
1. **Always provide complete topic coverage** - don't just answer the specific question, but teach the entire concept
2. **Use progressive learning** - start simple, then add complexity
3. **Include practical examples** and code snippets where applicable
4. **Provide multiple perspectives** on the same concept
5. **Encourage questions** and deeper exploration
6. **Connect topics** to show relationships and dependencies

## **Response Format:**
- Use **markdown formatting** with clear headings, bullet points, and code blocks
- Include **step-by-step instructions** where applicable
- Provide **practical examples** and exercises
- End with **follow-up questions** or **next steps**

## **Conversation History:**
{{#if history}}
{{#each history}}
**User:** {{{this.user}}}
**AI Teacher:** {{{this.model}}}
{{/each}}
{{/if}}

## **Current Question/Topic:**
{{{question}}}

**Your comprehensive teaching response:**`,
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
