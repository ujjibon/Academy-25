'use server';

/**
 * @fileOverview Automatic lesson teaching flow that provides proactive teaching
 * without waiting for user questions, using Gemini API for enhanced responses.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoLessonTeachingInputSchema = z.object({
  lesson: z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number(),
    introduction: z.object({
      text: z.string(),
    }),
  }).describe('The lesson to teach automatically.'),
  courseContext: z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
        id: z.string(),
        title: z.string(),
        duration: z.number(),
    }))
  }).describe('The course context.'),
  studentLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('The student\'s learning level.'),
  teachingMode: z.enum(['introduction', 'comprehensive', 'progressive']).describe('The teaching mode to use.'),
});

export type AutoLessonTeachingInput = z.infer<typeof AutoLessonTeachingInputSchema>;

const AutoLessonTeachingOutputSchema = z.object({
  welcomeMessage: z.string().describe('Welcome message that introduces the lesson.'),
  teachingContent: z.string().describe('Comprehensive teaching content for the lesson.'),
  keyConcepts: z.array(z.string()).describe('List of key concepts to be covered.'),
  learningObjectives: z.array(z.string()).describe('Clear learning objectives for the lesson.'),
  practicalExamples: z.array(z.string()).describe('Practical examples and applications.'),
  interactiveQuestions: z.array(z.string()).describe('Questions to engage the student.'),
  nextSteps: z.array(z.string()).describe('Suggested next steps and activities.'),
  estimatedTime: z.string().describe('Estimated time to complete the lesson.'),
});

export type AutoLessonTeachingOutput = z.infer<typeof AutoLessonTeachingOutputSchema>;

const autoLessonTeachingPrompt = ai.definePrompt({
  name: 'autoLessonTeachingPrompt',
  input: {schema: AutoLessonTeachingInputSchema},
  output: {schema: AutoLessonTeachingOutputSchema},
  prompt: `You are an expert AI Teacher using Gemini AI to provide automatic, proactive teaching for the lesson "{{lesson.title}}" in the course "{{courseContext.title}}".

## **Your Mission:**
Provide immediate, comprehensive teaching that starts automatically when a student enters a lesson. Don't wait for questions - be proactive and engaging.

## **Lesson Context:**
**Lesson:** {{lesson.title}}
**Content:** {{lesson.introduction.text}}
**Duration:** {{lesson.duration}} minutes
**Course:** {{courseContext.title}}
**Description:** {{courseContext.description}}

## **Teaching Mode:** {{teachingMode}}
Based on the teaching mode, adapt your approach:
- **Introduction:** Focus on welcoming the student and introducing the lesson. Provide an overview of what will be learned. Set clear expectations and learning objectives.
- **Comprehensive:** Provide complete, detailed teaching of all lesson concepts. Cover theory, practice, and applications. Include multiple learning approaches.
- **Progressive:** Break down the lesson into manageable steps. Provide structured, progressive learning. Include checkpoints and assessments.

## **Student Level:** {{studentLevel}}
Based on the student level, adapt your teaching:
- **Beginner:** Use simple language and clear explanations. Provide lots of examples and analogies. Focus on building foundational understanding.
- **Intermediate:** Build on existing knowledge. Include both basic and advanced concepts. Provide balanced theory and practice.
- **Advanced:** Focus on advanced concepts and nuances. Include complex scenarios and edge cases. Provide deep technical insights.

## **Teaching Requirements:**

### **1. Proactive Teaching Approach**
- **Start immediately** - Don't wait for student questions
- **Be engaging** - Use conversational, enthusiastic tone
- **Be comprehensive** - Cover all aspects of the lesson
- **Be interactive** - Include questions and activities

### **2. Structured Learning Experience**
- **Clear objectives** - What will the student learn?
- **Progressive content** - Logical flow from simple to complex
- **Practical applications** - Real-world examples and use cases
- **Interactive elements** - Questions, exercises, and activities

### **3. Gemini AI Enhanced Features**
- **Intelligent explanations** - Use AI to provide clear, accurate explanations
- **Adaptive content** - Adjust complexity based on student level
- **Rich examples** - Generate relevant, practical examples
- **Engaging interactions** - Create interesting questions and activities

## **Response Structure:**
1. **Welcome Message** - Engaging introduction to the lesson
2. **Learning Objectives** - Clear goals for the lesson
3. **Teaching Content** - Comprehensive explanation of the topic
4. **Key Concepts** - Important points to remember
5. **Practical Examples** - Real-world applications
6. **Interactive Questions** - Engaging questions for the student
7. **Next Steps** - What to do next in the learning journey

## **Format Requirements:**
- Use **markdown formatting** with clear headings
- Include **code blocks** for technical examples
- Use **bullet points** and **numbered lists** for clarity
- Make content **engaging and conversational**
- Include **interactive elements** throughout

**Your automatic teaching response:**`,
});

const autoLessonTeachingFlow = ai.defineFlow(
  {
    name: 'autoLessonTeachingFlow',
    inputSchema: AutoLessonTeachingInputSchema,
    outputSchema: AutoLessonTeachingOutputSchema,
  },
  async (input) => {
    const {output} = await autoLessonTeachingPrompt(input);
    return output!;
  }
);

export async function autoLessonTeaching(input: AutoLessonTeachingInput): Promise<AutoLessonTeachingOutput> {
  return autoLessonTeachingFlow(input);
}
