
'use server';

/**
 * @fileOverview An "AI Agent" flow for interactively creating course content.
 * This agent can use tools to generate lessons.
 *
 * - courseCreatorAgent - A function that acts as the agent.
 * - CreatorAgentInput - The input type for the function.
 * - CreatorAgentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single lesson, which the AI tool will generate.
const LessonSchema = z.object({
    id: z.string().describe("A unique identifier for the lesson (e.g., '1', '2', '3')."),
    title: z.string().describe("The title of the lesson."),
    duration: z.number().describe("An estimated duration of the lesson in minutes."),
    introduction: z.object({
        videoUrl: z.string().describe("A placeholder YouTube video URL, always use 'https://www.youtube.com/embed/9wK4gHo1c1A'."),
        text: z.string().describe("A concise introduction to the lesson's topic.")
    }),
    practice: z.object({
        questions: z.array(z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.string()
        })).min(5).describe("A list of at least 5 practice questions.")
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
        })).min(5).describe("A list of at least 5 assessment questions.")
    })
});

// Define the tool for the AI to use.
const generateLessonContent = ai.defineTool(
    {
        name: 'generateLessonContent',
        description: 'Generates the content for a single course lesson based on a given topic. This includes an introduction, practice questions, a project, and an assessment.',
        inputSchema: z.object({
            lessonTopic: z.string().describe("The specific topic for this lesson, e.g., 'React Hooks' or 'CSS Flexbox Layout'.")
        }),
        outputSchema: LessonSchema,
    },
    async (input) => {
        // This is a "sub-prompt" just for generating the lesson.
        const lessonPrompt = ai.definePrompt({
            name: 'lessonGeneratorPrompt',
            input: { schema: z.object({ lessonTopic: z.string() }) },
            output: { schema: LessonSchema },
            prompt: `You are an expert instructional designer. Generate a complete lesson on the topic of "{{lessonTopic}}".
            The lesson must follow the provided output schema precisely.
            - The video URL should always be 'https://www.youtube.com/embed/9wK4gHo1c1A'.
            - Create at least 5 practice questions and 5 assessment questions.
            - Ensure the 'correctAnswer' for each question exactly matches one of the 'options'.
            - The lesson ID should be a simple number string, like '1'.`
        });

        const { output } = await lessonPrompt(input);
        return output!;
    }
);

// Define the main agent flow.
const CreatorAgentInputSchema = z.object({
  instruction: z.string().describe("The user's instruction or message to the agent."),
  history: z.any().optional().describe('The history of the conversation.'),
});
export type CreatorAgentInput = z.infer<typeof CreatorAgentInputSchema>;

const CreatorAgentOutputSchema = z.object({
  response: z.string().describe("The AI agent's text response to the user."),
  generatedLesson: LessonSchema.optional().describe("The structured JSON content of a lesson, if one was generated."),
});
export type CreatorAgentOutput = z.infer<typeof CreatorAgentOutputSchema>;


const courseCreatorAgentFlow = ai.defineFlow(
  {
    name: 'courseCreatorAgentFlow',
    inputSchema: CreatorAgentInputSchema,
    outputSchema: CreatorAgentOutputSchema,
  },
  async (input) => {
    const { history, instruction } = input;
    
    // Call the model, providing it with the tool and the user's prompt.
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: instruction,
      history: history,
      tools: [generateLessonContent],
      system: `You are an AI Academic Counsellor, a friendly and brilliant partner helping an administrator build a new course. Your goal is to be helpful, interactive, and make the course creation process easy and collaborative.

- **Act as a partner**: Your tone should be conversational and encouraging. Ask clarifying questions if a request is ambiguous, but be ready to take the lead when the user's intent is clear.

- **Initial Interaction**: If the user starts with a broad idea like "Let's make a course", respond by asking for the topic in a friendly way. For example: "That sounds great! What subject are we building a course on today?"

- **Generating Content on Request**: If the user asks you to create a lesson (e.g., "Create a lesson about React Hooks"), you **MUST** use the 'generateLessonContent' tool. First, confirm you are doing so (e.g., "Excellent! I'll generate a lesson on React Hooks for you now. The content will appear in the editor to the right."), and then use the tool.

- **Handling Vague Requests**: If the user gives a very vague command like "do it" or "make the best one", don't ask for the topic again. Instead, take the initiative. Say something like, "Alright, let's create a fantastic course! I'll start with a popular and valuable topic: **Advanced React and Next.js**. I'll generate the first lesson, 'Introduction to Next.js', and you can review it in the editor." Then, immediately use the 'generateLessonContent' tool for that topic.

- **Responding to an Outline**: If the user provides a full course outline, acknowledge it enthusiastically. For example: "This is a fantastic outline! It gives us a clear path forward. I'll start by generating the content for the first lesson: '[First Lesson Title]'." Then, use the tool to generate that first lesson.

- **Providing a Template**: If the user asks for a "template", "structure", or "blank JSON", you **MUST** provide a valid, empty JSON object in a markdown code block that matches the lesson structure. Do not use the tool. Explain that they can use this template to build a lesson manually.

- **Focus on the Editor**: Always remind the user that the generated content will appear in the lesson editor on the right-hand side of the screen, where they can review and make changes. Your primary goal is to populate that editor for them. Your own chat responses should be for conversation and guidance.

Your main job is to make the admin's life easier by generating high-quality lesson content and populating the editor, making course creation a seamless and enjoyable experience.`,
    });

    const output: CreatorAgentOutput = { response: llmResponse.text };

    // Check if the model decided to use the tool.
    const toolCalls = llmResponse.toolCalls;
    if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
            if (call.name === 'generateLessonContent') {
                const toolResult = await call.result();
                output.generatedLesson = toolResult.output as z.infer<typeof LessonSchema>;
            }
        }
    }
    
    return output;
  }
);


export async function courseCreatorAgent(input: CreatorAgentInput): Promise<CreatorAgentOutput> {
  return courseCreatorAgentFlow(input);
}
