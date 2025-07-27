'use server';

/**
 * @fileOverview An "AI Agent" flow for generating a complete, multi-lesson course from a single topic.
 *
 * - generateCourse - A function that architects and generates the entire course structure.
 * - GenerateCourseInput - The input type for the function.
 * - GenerateCourseOutput - The return type for the function, which is the full course object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Course } from '@/lib/data-provider';

const GenerateCourseInputSchema = z.object({
  topic: z
    .string()
    .describe('The high-level topic for the course. e.g., "Introduction to Python for Data Science".'),
});
export type GenerateCourseInput = z.infer<typeof GenerateCourseInputSchema>;

// The output schema should match the Course type from our data provider.
const GenerateCourseOutputSchema = z.object({
  id: z.string().describe("A url-friendly identifier for the course, e.g., 'python-for-data-science'."),
  title: z.string().describe('A catchy and descriptive title for the course.'),
  description: z.string().describe('A one-paragraph summary of what the course covers and who it is for.'),
  image: z.string().url().describe("A placeholder image URL for the course. Use placehold.co."),
  lessons: z.array(z.object({
    id: z.string().describe("A unique identifier for the lesson (e.g., '1', '2', '3')."),
    title: z.string().describe("The title of the lesson."),
    duration: z.number().describe("An estimated duration of the lesson in minutes."),
    introduction: z.object({
        videoUrl: z.string().url().describe("A placeholder YouTube video URL."),
        text: z.string().describe("A concise introduction to the lesson's topic.")
    }),
    practice: z.object({
        questions: z.array(z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.string()
        })).min(20).describe("A list of at least 20 practice questions to reinforce learning.")
    }),
    project: z.object({
        title: z.string(),
        description: z.string()
    }),
    assessment: z.object({
        questions: z.array(z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.string()
        })).min(20).describe("A list of at least 20 assessment questions to test understanding.")
    })
  })).min(5).describe('A list of at least 5 comprehensive lessons.')
});

export type GenerateCourseOutput = z.infer<typeof GenerateCourseOutputSchema>;


export async function generateCourse(
  input: GenerateCourseInput
): Promise<GenerateCourseOutput> {
  return generateCourseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoursePrompt',
  input: {schema: GenerateCourseInputSchema},
  output: {schema: GenerateCourseOutputSchema},
  prompt: `You are an expert AI Instructional Designer. Your task is to architect and generate a complete, production-ready, multi-lesson course based on a given topic. The course must be comprehensive, engaging, and structured for an online learning platform.

  **Topic:** {{{topic}}}

  **Your Task:**
  Generate a complete course object that follows the provided output schema precisely.

  **Guidelines:**
  1.  **Course Structure**: Create at least 5 distinct but related lessons. The lessons should build on each other logically.
  2.  **Lesson Content**:
      -   **Introduction**: Write a clear, concise text introduction for each lesson. The video URL should always be 'https://www.youtube.com/embed/9wK4gHo1c1A'.
      -   **Duration**: Provide a realistic duration in minutes for each lesson.
  3.  **Quizzes (Practice & Assessment)**:
      -   Generate **at least 20 unique practice questions** and **20 unique assessment questions** for *each* lesson.
      -   The questions should be distinct between the practice and assessment sections.
      -   All questions must be multiple-choice with 4 options.
      -   Crucially, the \`correctAnswer\` field **MUST EXACTLY MATCH** one of the strings in the \`options\` array.
  4.  **Project**: Design a practical, hands-on project for each lesson that allows the student to apply what they've learned.
  5.  **IDs**: The course ID should be a URL-friendly slug based on the title. Lesson IDs should be simple sequential numbers as strings ('1', '2', etc.).
  6.  **Image**: Use a placeholder image from 'https://placehold.co/600x400.png'.
  
  Your output must be a single, valid JSON object conforming to the output schema. Do not add any extra commentary.`,
});

const generateCourseFlow = ai.defineFlow(
  {
    name: 'generateCourseFlow',
    inputSchema: GenerateCourseInputSchema,
    outputSchema: GenerateCourseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
