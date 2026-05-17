import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { deepSeekVisualGenerator } from '@/lib/deepseek-visual-generator';

const ClassroomSlideGeneratorInputSchema = z.object({
  lesson: z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number(),
    introduction: z.object({
      text: z.string(),
    }),
  }),
  courseContext: z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
      id: z.string(),
      title: z.string(),
      duration: z.number(),
    })),
  }),
  learningLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  visualStyle: z.enum(['minimal', 'detailed', 'interactive']),
  slideCount: z.number().min(3).max(15),
});

export type ClassroomSlideGeneratorInput = z.infer<typeof ClassroomSlideGeneratorInputSchema>;

const SlideSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.enum(['introduction', 'concept', 'example', 'practice', 'summary', 'visual']),
  visualType: z.enum(['chart', 'diagram', 'image', 'video', 'code', 'infographic']),
  duration: z.number(),
  interactive: z.boolean(),
  keyPoints: z.array(z.string()),
  examples: z.array(z.string()),
  visualDescription: z.string(),
});

const ClassroomSlideGeneratorOutputSchema = z.object({
  slides: z.array(SlideSchema),
  totalDuration: z.number(),
  learningObjectives: z.array(z.string()),
  visualElements: z.array(z.object({
    type: z.string(),
    description: z.string(),
    placement: z.string(),
  })),
  interactiveElements: z.array(z.object({
    type: z.string(),
    description: z.string(),
    slideId: z.string(),
  })),
  teachingNotes: z.string(),
});

export type ClassroomSlideGeneratorOutput = z.infer<typeof ClassroomSlideGeneratorOutputSchema>;

const classroomSlideGeneratorPrompt = ai.definePrompt({
  name: 'classroomSlideGeneratorPrompt',
  input: { schema: ClassroomSlideGeneratorInputSchema },
  output: { schema: ClassroomSlideGeneratorOutputSchema },
  prompt: `You are an expert AI Educational Designer specializing in creating engaging, visual classroom presentations for the lesson "{{lesson.title}}" in the course "{{courseContext.title}}".

## **Your Mission:**
Create a comprehensive slide-based presentation that transforms the lesson content into an interactive, visual learning experience that feels like being in a real classroom with a skilled teacher.

## **Lesson Context:**
**Title:** {{lesson.title}}
**Duration:** {{lesson.duration}} minutes
**Content:** {{lesson.introduction.text}}
**Course:** {{courseContext.title}}
**Description:** {{courseContext.description}}

## **Design Requirements:**

### **1. Visual-First Approach**
- **Create slides that are visually engaging** with clear hierarchy
- **Use visual metaphors and analogies** to explain complex concepts
- **Include charts, diagrams, and infographics** where appropriate
- **Design for screen presentation** with large, readable text

### **2. Teaching Methodology**
Based on the learning level "{{learningLevel}}", adapt your teaching approach:
- **Beginner:** Use simple language, lots of visuals, step-by-step explanations, and analogies
- **Intermediate:** Balance theory with practice, include real-world examples, and build on existing knowledge
- **Advanced:** Focus on nuances, edge cases, and deep understanding with complex visualizations

### **3. Slide Structure**
Create exactly {{slideCount}} slides with the following distribution:
- **1 Introduction slide** - Welcome and overview
- **2-3 Concept slides** - Core learning content
- **2-3 Example slides** - Practical applications
- **1-2 Practice slides** - Interactive exercises
- **1 Summary slide** - Key takeaways

### **4. Visual Elements**
For each slide, specify visual elements that enhance learning:
- **Charts:** For data visualization and comparisons
- **Diagrams:** For process flows and relationships
- **Images:** For real-world examples and context
- **Infographics:** For complex information breakdown
- **Code blocks:** For technical examples
- **Video placeholders:** For demonstrations

### **5. Interactive Elements**
Include interactive components that engage students:
- **Questions and polls** for engagement
- **Practice exercises** with immediate feedback
- **Case studies** for real-world application
- **Group activities** for collaborative learning
- **Self-assessment** checkpoints

## **Slide Content Requirements:**

### **Each Slide Must Include:**
1. **Clear, engaging title** that captures attention
2. **Well-structured content** with proper hierarchy
3. **Visual element description** for design implementation
4. **Key learning points** for student focus
5. **Appropriate duration** based on content complexity
6. **Interactive elements** where beneficial

### **Content Guidelines:**
- **Use conversational, teacher-like language**
- **Include analogies and real-world connections**
- **Provide clear examples and counter-examples**
- **Use progressive disclosure** (simple to complex)
- **Include memory aids and mnemonics**
- **Add motivational elements** to maintain engagement

## **Response Structure:**

### **1. Slides Array**
For each slide, provide:
- **id:** Unique identifier
- **title:** Engaging slide title
- **content:** Full slide content with markdown formatting
- **type:** Slide category (introduction, concept, example, practice, summary, visual)
- **visualType:** Type of visual element (chart, diagram, image, video, code, infographic)
- **duration:** Time in seconds (30-120 seconds per slide)
- **interactive:** Whether slide includes interactive elements
- **keyPoints:** 3-5 key learning points
- **examples:** 2-3 practical examples
- **visualDescription:** Detailed description of visual elements

### **2. Supporting Information**
- **totalDuration:** Sum of all slide durations
- **learningObjectives:** 3-5 clear learning outcomes
- **visualElements:** List of all visual components
- **interactiveElements:** List of all interactive features
- **teachingNotes:** Additional guidance for instructors

## **Quality Standards:**
- **Professional presentation quality** suitable for corporate training
- **Clear visual hierarchy** with proper typography
- **Engaging content** that maintains attention
- **Practical examples** that students can relate to
- **Progressive learning** that builds understanding
- **Inclusive design** that works for all learning styles

## **Special Instructions:**
- **Make it feel like a real classroom** with teacher presence
- **Use storytelling techniques** to make content memorable
- **Include "aha moments"** that create understanding breakthroughs
- **Balance information density** with visual breathing room
- **Create emotional connection** to the learning material

**Generate a comprehensive, engaging classroom presentation that transforms this lesson into an unforgettable learning experience.**`,
});

const classroomSlideGeneratorFlow = ai.defineFlow(
  {
    name: 'classroomSlideGeneratorFlow',
    inputSchema: ClassroomSlideGeneratorInputSchema,
    outputSchema: ClassroomSlideGeneratorOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await classroomSlideGeneratorPrompt(input);
      
      // For now, return the basic slides without DeepSeek enhancement
      // This ensures the core functionality works even without DeepSeek API
      return output!;
      
      // TODO: Re-enable DeepSeek visual enhancement once API is properly configured
      /*
      // Enhance slides with simple visuals using DeepSeek
      const enhancedSlides = await Promise.all(
        output.slides.map(async (slide) => {
          try {
            // Generate simple visual for concept and example slides
            if (slide.type === 'concept' || slide.type === 'example') {
              const visual = await deepSeekVisualGenerator.generateSimpleVisual(
                slide.title,
                'diagram',
                slide.content
              );
              
              return {
                ...slide,
                visualDescription: visual.description,
                visualData: {
                  type: visual.type,
                  data: {
                    description: visual.description,
                    svgContent: visual.svgContent,
                    mermaidCode: visual.mermaidCode,
                    cssVisual: visual.cssVisual,
                  }
                }
              };
            }
            return slide;
          } catch (error) {
            console.error(`Error generating visual for slide ${slide.id}:`, error);
            return slide; // Return original slide if visual generation fails
          }
        })
      );

      return {
        ...output,
        slides: enhancedSlides,
      };
      */
    } catch (error) {
      console.error('Error in classroom slide generator flow:', error);
      throw error;
    }
  }
);

export async function classroomSlideGenerator(input: ClassroomSlideGeneratorInput): Promise<ClassroomSlideGeneratorOutput> {
  return classroomSlideGeneratorFlow(input);
}
