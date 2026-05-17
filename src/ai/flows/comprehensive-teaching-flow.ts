'use server';

/**
 * @fileOverview A comprehensive teaching flow that provides step-by-step instruction
 * for all course topics with progressive learning and adaptive teaching.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComprehensiveTeachingInputSchema = z.object({
  topic: z.string().describe("The specific topic or lesson the student wants to learn about."),
  currentLesson: z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number(),
    introduction: z.object({
      text: z.string(),
    }),
  }).describe('The current lesson context.'),
  courseContext: z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
        id: z.string(),
        title: z.string(),
        duration: z.number(),
    }))
  }).describe('The course context.'),
  learningLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('The student\'s current learning level.'),
  learningStyle: z.enum(['visual', 'practical', 'theoretical', 'auditory']).optional().describe('The student\'s preferred learning style.'),
  specificQuestion: z.string().optional().describe('A specific question the student has about the topic.'),
});

export type ComprehensiveTeachingInput = z.infer<typeof ComprehensiveTeachingInputSchema>;

const ComprehensiveTeachingOutputSchema = z.object({
  teachingContent: z.string().describe('Comprehensive teaching content covering all aspects of the topic.'),
  keyConcepts: z.array(z.string()).describe('List of key concepts covered in this teaching session.'),
  practicalExamples: z.array(z.string()).describe('Practical examples and applications.'),
  nextSteps: z.array(z.string()).describe('Suggested next steps for continued learning.'),
  followUpQuestions: z.array(z.string()).describe('Questions to help deepen understanding.'),
});

export type ComprehensiveTeachingOutput = z.infer<typeof ComprehensiveTeachingOutputSchema>;

const comprehensiveTeachingPrompt = ai.definePrompt({
  name: 'comprehensiveTeachingPrompt',
  input: {schema: ComprehensiveTeachingInputSchema},
  output: {schema: ComprehensiveTeachingOutputSchema},
  prompt: `You are an expert AI Teacher providing comprehensive, step-by-step instruction for "{{topic}}" in the context of "{{courseContext.title}}".

## **Your Teaching Mission:**
Provide complete, thorough coverage of the topic that ensures the student understands ALL aspects, not just the specific question they asked.

## **Current Lesson Context:**
**Lesson:** {{currentLesson.title}}
**Content:** {{currentLesson.introduction.text}}
**Duration:** {{currentLesson.duration}} minutes

## **Course Context:**
**Course:** {{courseContext.title}}
**Description:** {{courseContext.description}}

**Available Lessons:**
{{#each courseContext.lessons}}
- {{this.title}} ({{this.duration}} minutes)
{{/each}}

## **Student Profile:**
- **Learning Level:** {{learningLevel}}
- **Learning Style:** {{learningStyle}}
- **Specific Question:** {{specificQuestion}}

## **Teaching Requirements:**

### **1. Comprehensive Topic Coverage**
- **Cover ALL aspects** of the topic, not just the specific question
- **Start with fundamentals** and build to advanced concepts
- **Include theory AND practice** for complete understanding
- **Connect to related topics** in the course

### **2. Structured Learning Approach**
- **Use clear headings** and organized sections
- **Provide step-by-step explanations** with logical progression
- **Include multiple learning paths** (visual, practical, theoretical)
- **Add checkpoints** to verify understanding

### **3. Adaptive Teaching Style**
- **Adapt to {{learningStyle}} learning style:**
  - **Visual:** Use diagrams, charts, and visual representations. Provide visual examples and illustrations.
  - **Practical:** Focus on hands-on examples and real-world applications. Provide code snippets and practical exercises.
  - **Theoretical:** Emphasize underlying principles and concepts. Provide detailed explanations of why things work.
  - **Auditory:** Use clear, conversational explanations. Provide verbal examples and analogies.

### **4. Progressive Learning**
- **Adapt to {{learningLevel}} level:**
  - **Beginner:** Start with basic concepts and simple explanations. Use analogies and everyday examples. Avoid jargon and complex terminology.
  - **Intermediate:** Build on existing knowledge. Include both basic and advanced concepts. Provide balanced theory and practice.
  - **Advanced:** Focus on advanced concepts and nuances. Include edge cases and complex scenarios. Provide deep technical insights.

## **Response Structure:**
1. **Introduction** - Overview of what will be covered
2. **Core Concepts** - Fundamental understanding
3. **Detailed Explanation** - Step-by-step breakdown
4. **Practical Examples** - Real-world applications
5. **Common Pitfalls** - Mistakes to avoid
6. **Advanced Topics** - Related concepts and extensions
7. **Summary** - Key takeaways
8. **Next Steps** - Continued learning path

## **Format Requirements:**
- Use **markdown formatting** with clear headings
- Include **code blocks** for technical examples
- Use **bullet points** and **numbered lists** for clarity
- Provide **practical examples** and **exercises**
- End with **follow-up questions** for deeper learning

**Your comprehensive teaching response:**`,
});

const comprehensiveTeachingFlow = ai.defineFlow(
  {
    name: 'comprehensiveTeachingFlow',
    inputSchema: ComprehensiveTeachingInputSchema,
    outputSchema: ComprehensiveTeachingOutputSchema,
  },
  async (input) => {
    const {output} = await comprehensiveTeachingPrompt(input);
    return output!;
  }
);

export async function comprehensiveTeaching(input: ComprehensiveTeachingInput): Promise<ComprehensiveTeachingOutput> {
  return comprehensiveTeachingFlow(input);
}
