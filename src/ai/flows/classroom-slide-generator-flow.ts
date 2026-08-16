import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { deepSeekVisualGenerator } from '@/lib/deepseek-visual-generator';
import {
  generateEducationalImage,
  mapWithConcurrency,
} from '@/lib/openai-image-generator';

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
    lessons: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        duration: z.number(),
      })
    ),
  }),
  learningLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  visualStyle: z.enum(['minimal', 'detailed', 'interactive']),
  slideCount: z.number().min(3).max(15),
});

export type ClassroomSlideGeneratorInput = z.infer<
  typeof ClassroomSlideGeneratorInputSchema
>;

const SlideVisualDataSchema = z
  .object({
    type: z.string(),
    url: z.string().optional(),
    data: z
      .object({
        description: z.string().optional(),
        svgContent: z.string().optional(),
        mermaidCode: z.string().optional(),
        cssVisual: z.string().optional(),
        imageDataUrl: z.string().optional(),
      })
      .optional(),
  })
  .optional();

/** Schema used for LLM output (no visualData — filled in post-process). */
const LlmSlideSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.enum([
    'introduction',
    'concept',
    'example',
    'practice',
    'summary',
    'visual',
  ]),
  visualType: z.enum([
    'chart',
    'diagram',
    'image',
    'video',
    'code',
    'infographic',
  ]),
  duration: z.number(),
  interactive: z.boolean(),
  keyPoints: z.array(z.string()),
  examples: z.array(z.string()),
  visualDescription: z.string(),
});

const SlideSchema = LlmSlideSchema.extend({
  visualData: SlideVisualDataSchema,
  imageDataUrl: z.string().optional(),
});

export type ClassroomSlide = z.infer<typeof SlideSchema>;

const LlmOutputSchema = z.object({
  slides: z.array(LlmSlideSchema),
  totalDuration: z.number(),
  learningObjectives: z.array(z.string()),
  visualElements: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      placement: z.string(),
    })
  ),
  interactiveElements: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      slideId: z.string(),
    })
  ),
  teachingNotes: z.string(),
});

const ClassroomSlideGeneratorOutputSchema = z.object({
  slides: z.array(SlideSchema),
  totalDuration: z.number(),
  learningObjectives: z.array(z.string()),
  visualElements: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      placement: z.string(),
    })
  ),
  interactiveElements: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      slideId: z.string(),
    })
  ),
  teachingNotes: z.string(),
});

export type ClassroomSlideGeneratorOutput = z.infer<
  typeof ClassroomSlideGeneratorOutputSchema
>;

const SVG_VISUAL_TYPES = new Set(['chart', 'diagram', 'infographic']);
const ENRICH_SLIDE_TYPES = new Set(['concept', 'example', 'visual']);

function mapVisualTypeForSvg(
  visualType: ClassroomSlide['visualType']
): 'diagram' | 'chart' | 'infographic' | 'flowchart' | 'mindmap' {
  if (visualType === 'chart') return 'chart';
  if (visualType === 'infographic') return 'infographic';
  return 'diagram';
}

async function enrichSlide(
  slide: z.infer<typeof LlmSlideSchema>
): Promise<ClassroomSlide> {
  const shouldEnrich =
    ENRICH_SLIDE_TYPES.has(slide.type) || slide.visualType === 'image';

  if (!shouldEnrich) {
    return {
      ...slide,
      visualData: {
        type: slide.visualType,
        data: { description: slide.visualDescription },
      },
    };
  }

  try {
    if (slide.visualType === 'image') {
      const image = await generateEducationalImage(
        slide.visualDescription || slide.title
      );
      return {
        ...slide,
        imageDataUrl: image.imageDataUrl,
        visualData: {
          type: 'image',
          url: image.imageDataUrl,
          data: {
            description: slide.visualDescription,
            imageDataUrl: image.imageDataUrl,
          },
        },
      };
    }

    if (SVG_VISUAL_TYPES.has(slide.visualType)) {
      const visual = await deepSeekVisualGenerator.generateSimpleVisual(
        slide.title,
        mapVisualTypeForSvg(slide.visualType),
        slide.content.slice(0, 800)
      );

      return {
        ...slide,
        visualDescription: visual.description || slide.visualDescription,
        visualData: {
          type: slide.visualType,
          data: {
            description: visual.description || slide.visualDescription,
            svgContent: visual.svgContent,
            mermaidCode: visual.mermaidCode,
            cssVisual: visual.cssVisual,
          },
        },
      };
    }
  } catch (error) {
    console.error(`Error enriching visual for slide ${slide.id}:`, error);
  }

  return {
    ...slide,
    visualData: {
      type: slide.visualType,
      data: { description: slide.visualDescription },
    },
  };
}

const classroomSlideGeneratorPrompt = ai.definePrompt({
  name: 'classroomSlideGeneratorPrompt',
  input: { schema: ClassroomSlideGeneratorInputSchema },
  output: { schema: LlmOutputSchema },
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
- **Images:** For real-world examples and context (use visualType "image" on at least one concept or example slide)
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
- **visualDescription:** Detailed description of visual elements (used to generate images/diagrams)

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
      if (!output) {
        throw new Error('No output from classroom slide generator prompt');
      }

      const enhancedSlides = await mapWithConcurrency(
        output.slides,
        3,
        (slide) => enrichSlide(slide)
      );

      return {
        ...output,
        slides: enhancedSlides,
      };
    } catch (error) {
      console.error('Error in classroom slide generator flow:', error);
      throw error;
    }
  }
);

export async function classroomSlideGenerator(
  input: ClassroomSlideGeneratorInput
): Promise<ClassroomSlideGeneratorOutput> {
  return classroomSlideGeneratorFlow(input);
}
