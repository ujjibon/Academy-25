'use server';

/**
 * @fileOverview Continuous learning flow that provides ongoing teaching
 * and automatic topic progression using Gemini API.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContinuousLearningInputSchema = z.object({
  currentTopic: z.string().describe("The current topic being taught."),
  lessonProgress: z.number().min(0).max(100).describe("The student's progress through the lesson (0-100%)."),
  studentEngagement: z.enum(['low', 'medium', 'high']).describe("How engaged the student appears to be."),
  timeSpent: z.number().describe("Time spent on current topic in minutes."),
  questionsAsked: z.number().describe("Number of questions the student has asked."),
  lessonContext: z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number(),
    introduction: z.object({
      text: z.string(),
    }),
  }).describe('The lesson context.'),
  courseContext: z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
        id: z.string(),
        title: z.string(),
        duration: z.number(),
    }))
  }).describe('The course context.'),
});

export type ContinuousLearningInput = z.infer<typeof ContinuousLearningInputSchema>;

const ContinuousLearningOutputSchema = z.object({
  nextTeachingAction: z.enum(['continue', 'deepen', 'move_on', 'review', 'practice']).describe('The next teaching action to take.'),
  teachingContent: z.string().describe('Content for the next teaching moment.'),
  engagementStrategy: z.string().describe('Strategy to increase student engagement.'),
  suggestedActivities: z.array(z.string()).describe('Suggested activities for the student.'),
  progressCheck: z.string().describe('A question or activity to check understanding.'),
  adaptiveContent: z.string().describe('Content adapted to student needs.'),
});

export type ContinuousLearningOutput = z.infer<typeof ContinuousLearningOutputSchema>;

const continuousLearningPrompt = ai.definePrompt({
  name: 'continuousLearningPrompt',
  input: {schema: ContinuousLearningInputSchema},
  output: {schema: ContinuousLearningOutputSchema},
  prompt: `You are an expert AI Teacher using Gemini AI to provide continuous, adaptive learning for the topic "{{currentTopic}}" in the lesson "{{lessonContext.title}}".

## **Current Learning State:**
- **Topic:** {{currentTopic}}
- **Progress:** {{lessonProgress}}% through the lesson
- **Engagement Level:** {{studentEngagement}}
- **Time Spent:** {{timeSpent}} minutes
- **Questions Asked:** {{questionsAsked}}

## **Lesson Context:**
**Lesson:** {{lessonContext.title}}
**Content:** {{lessonContext.introduction.text}}
**Duration:** {{lessonContext.duration}} minutes

## **Course Context:**
**Course:** {{courseContext.title}}
**Description:** {{courseContext.description}}

## **Your Mission:**
Provide continuous, adaptive teaching that responds to the student's current state and keeps them engaged and learning effectively.

## **Adaptive Teaching Strategy:**

### **Based on Progress ({{lessonProgress}}%):**
Adapt your approach based on the student's progress:
- **Early Stage (0-25%):** Focus on building foundational understanding. Provide clear explanations and basic examples. Continue with fundamentals.
- **Building Stage (26-50%):** Develop deeper understanding. Introduce more complex concepts and applications. Deepen the current topic.
- **Application Stage (51-75%):** Focus on practical application. Provide hands-on examples and exercises. Practice and apply concepts.
- **Mastery Stage (76-100%):** Reinforce and extend learning. Review key concepts and introduce advanced topics. Review and move to next topic.

### **Based on Engagement ({{studentEngagement}}):**
Adapt your approach based on the student's engagement level:
- **Low Engagement:** Increase interactivity and relevance. Use more examples, ask questions, make content more relatable. Focus on boosting engagement and motivation.
- **Medium Engagement:** Maintain current pace with variety. Mix different types of content and activities. Focus on sustaining interest and deepening understanding.
- **High Engagement:** Challenge and extend learning. Provide advanced concepts and complex applications. Focus on maximizing learning potential.

### **Based on Time Spent ({{timeSpent}} minutes):**
Adapt your approach based on how long the student has been learning:
- **Just Started (0-5 min):** Provide comprehensive introduction. Set clear expectations and learning path.
- **Learning Phase (6-15 min):** Focus on core concepts. Build understanding systematically.
- **Extended Learning (15+ min):** Provide variety and reinforcement. Mix review, practice, and new concepts.

## **Response Requirements:**

### **1. Next Teaching Action**
Choose the most appropriate action based on current state:
- **continue:** Keep teaching the current topic
- **deepen:** Go deeper into the current topic
- **move_on:** Progress to the next topic
- **review:** Review previous concepts
- **practice:** Focus on practical application

### **2. Adaptive Content**
- **Engaging:** Use conversational, enthusiastic tone
- **Relevant:** Connect to student's current state
- **Progressive:** Build on previous learning
- **Interactive:** Include questions and activities

### **3. Engagement Strategy**
- **Specific actions** to increase student engagement
- **Motivational elements** to maintain interest
- **Interactive elements** to keep student active

### **4. Suggested Activities**
- **Practical exercises** related to the topic
- **Interactive questions** to test understanding
- **Real-world applications** to show relevance
- **Creative challenges** to extend learning

### **5. Progress Check**
- **Understanding assessment** appropriate to current level
- **Interactive question** to gauge comprehension
- **Practical application** to test skills

**Your adaptive teaching response:**`,
});

const continuousLearningFlow = ai.defineFlow(
  {
    name: 'continuousLearningFlow',
    inputSchema: ContinuousLearningInputSchema,
    outputSchema: ContinuousLearningOutputSchema,
  },
  async (input) => {
    const {output} = await continuousLearningPrompt(input);
    return output!;
  }
);

export async function continuousLearning(input: ContinuousLearningInput): Promise<ContinuousLearningOutput> {
  return continuousLearningFlow(input);
}
