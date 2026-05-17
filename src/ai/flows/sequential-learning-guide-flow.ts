'use server';

/**
 * @fileOverview Sequential learning guide flow that creates engaging transitions
 * between introduction, practice, and assessment phases.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SequentialLearningGuideInputSchema = z.object({
  currentPhase: z.enum(['introduction', 'practice', 'assessment']).describe('The current learning phase.'),
  lessonProgress: z.number().min(0).max(100).describe('Overall progress through the lesson (0-100%).'),
  phaseProgress: z.number().min(0).max(100).describe('Progress within current phase (0-100%).'),
  timeSpent: z.number().describe('Time spent in current phase (minutes).'),
  engagementLevel: z.enum(['low', 'medium', 'high']).describe('Current engagement level.'),
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
  completedActivities: z.array(z.string()).optional().describe('Activities already completed.'),
});

export type SequentialLearningGuideInput = z.infer<typeof SequentialLearningGuideInputSchema>;

const SequentialLearningGuideOutputSchema = z.object({
  phaseTransition: z.object({
    fromPhase: z.string(),
    toPhase: z.string(),
    transitionMessage: z.string(),
    motivationMessage: z.string(),
  }).describe('Information about the phase transition.'),
  nextStepGuide: z.object({
    title: z.string(),
    description: z.string(),
    estimatedTime: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    prerequisites: z.array(z.string()),
  }).describe('Guide for the next learning step.'),
  engagementBoosters: z.array(z.string()).describe('Elements to boost engagement.'),
  progressCelebration: z.string().optional().describe('Celebration message for progress made.'),
  interactiveElements: z.array(z.object({
    type: z.enum(['quiz', 'exercise', 'challenge', 'reflection']),
    title: z.string(),
    description: z.string(),
    actionText: z.string(),
  })).describe('Interactive elements for the current phase.'),
  learningPath: z.array(z.object({
    phase: z.string(),
    status: z.enum(['completed', 'current', 'upcoming']),
    title: z.string(),
    description: z.string(),
  })).describe('Visual learning path for the student.'),
});

export type SequentialLearningGuideOutput = z.infer<typeof SequentialLearningGuideOutputSchema>;

const sequentialLearningGuidePrompt = ai.definePrompt({
  name: 'sequentialLearningGuidePrompt',
  input: {schema: SequentialLearningGuideInputSchema},
  output: {schema: SequentialLearningGuideOutputSchema},
  prompt: `You are an expert AI Learning Guide using Gemini AI to create engaging, sequential learning experiences for the lesson "{{lessonContext.title}}" in the course "{{courseContext.title}}".

## **Current Learning State:**
- **Current Phase:** {{currentPhase}}
- **Overall Progress:** {{lessonProgress}}% through the lesson
- **Phase Progress:** {{phaseProgress}}% through current phase
- **Time Spent:** {{timeSpent}} minutes in current phase
- **Engagement Level:** {{engagementLevel}}

## **Lesson Context:**
**Lesson:** {{lessonContext.title}}
**Content:** {{lessonContext.introduction.text}}
**Duration:** {{lessonContext.duration}} minutes

## **Your Mission:**
Create an engaging, sequential learning experience that naturally guides students through introduction → practice → assessment phases with smooth transitions and motivational elements.

## **Sequential Learning Strategy:**

### **Phase Transitions:**
Based on the current phase "{{currentPhase}}", provide appropriate transition guidance:

- **Introduction Phase:** Focus on building confidence and preparing for hands-on learning. Transition message: "Ready to put your knowledge into action?"
- **Practice Phase:** Focus on reinforcing learning and preparing for evaluation. Transition message: "Time to show what you've learned!"
- **Assessment Phase:** Focus on celebrating achievement and planning next steps. Transition message: "Congratulations! Ready for the next challenge?"

### **Engagement Strategies by Phase:**
Based on the current phase "{{currentPhase}}", use appropriate engagement strategies:

- **Introduction Phase:** Use storytelling and real-world connections, provide clear learning objectives, include interactive examples and analogies, build excitement for practical application
- **Practice Phase:** Provide hands-on exercises and challenges, offer immediate feedback and hints, include gamification elements (points, badges), encourage experimentation and learning from mistakes
- **Assessment Phase:** Create confidence-building assessments, provide detailed feedback and explanations, celebrate achievements and progress, connect learning to real-world applications

### **Progress-Based Adaptations:**
Based on the current progress ({{lessonProgress}}%), adapt your approach:

- **Early Stage (0-33%):** Focus on building confidence and understanding. Provide encouragement and clear guidance. Use motivational messages, clear instructions, and supportive feedback.
- **Middle Stage (34-66%):** Maintain momentum and engagement. Mix challenge with support. Use progress celebrations, varied activities, and peer comparisons.
- **Advanced Stage (67-100%):** Focus on mastery and application. Provide advanced challenges and real-world connections. Use achievement celebrations, advanced exercises, and future learning paths.

## **Response Requirements:**

### **1. Phase Transition**
- **Smooth transition** from current phase to next
- **Motivational message** to maintain engagement
- **Clear next steps** and expectations

### **2. Next Step Guide**
- **Clear title** and description of next activity
- **Realistic time estimate** for completion
- **Appropriate difficulty** level
- **Prerequisites** or preparation needed

### **3. Engagement Boosters**
- **Specific strategies** to increase engagement
- **Interactive elements** to maintain interest
- **Motivational factors** to encourage continued learning

### **4. Progress Celebration**
- **Acknowledge achievements** made so far
- **Celebrate milestones** and progress
- **Build confidence** for next steps

### **5. Interactive Elements**
- **Varied activity types** (quiz, exercise, challenge, reflection)
- **Clear descriptions** and action items
- **Appropriate difficulty** for current phase

### **6. Learning Path**
- **Visual representation** of learning journey
- **Clear status** for each phase
- **Motivational descriptions** for each step

**Your engaging sequential learning guide:**`,
});

const sequentialLearningGuideFlow = ai.defineFlow(
  {
    name: 'sequentialLearningGuideFlow',
    inputSchema: SequentialLearningGuideInputSchema,
    outputSchema: SequentialLearningGuideOutputSchema,
  },
  async (input) => {
    const {output} = await sequentialLearningGuidePrompt(input);
    return output!;
  }
);

export async function sequentialLearningGuide(input: SequentialLearningGuideInput): Promise<SequentialLearningGuideOutput> {
  return sequentialLearningGuideFlow(input);
}
