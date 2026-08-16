import { z } from 'zod';

export const LEARNING_GAME_TYPES = [
  'quiz-blitz',
  'match-up',
  'true-or-twist',
  'fill-gap',
  'scenario',
  'speed-sort',
] as const;

export type LearningGameType = (typeof LEARNING_GAME_TYPES)[number];

export const QuizItemSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(3).max(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const MatchPairSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const TrueFalseItemSchema = z.object({
  statement: z.string(),
  isTrue: z.boolean(),
  explanation: z.string(),
});

export const FillGapItemSchema = z.object({
  sentence: z
    .string()
    .describe('Sentence with exactly one blank marked as ____'),
  answer: z.string(),
  distractors: z.array(z.string()).min(2).max(3),
  hint: z.string(),
});

export const ScenarioItemSchema = z.object({
  situation: z.string(),
  options: z.array(z.string()).min(3).max(4),
  correctOption: z.string(),
  explanation: z.string(),
});

export const SortBucketSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const SortItemSchema = z.object({
  text: z.string(),
  correctBucketId: z.string(),
});

export const GenerateLearningGameOutputSchema = z.object({
  gameType: z.enum(LEARNING_GAME_TYPES),
  title: z.string().describe('Catchy game title.'),
  tagline: z.string().describe('One short playful line.'),
  topicFocus: z.string(),
  estimatedMinutes: z.number().describe('Play time estimate 3-12.'),
  xpReward: z.number().describe('XP between 25 and 80.'),
  instructions: z.string().describe('2-3 sentences of how to play.'),
  quizItems: z.array(QuizItemSchema).describe('For quiz-blitz: 5-8 items. Else [].'),
  matchPairs: z.array(MatchPairSchema).describe('For match-up: 5-7 pairs. Else [].'),
  trueFalseItems: z
    .array(TrueFalseItemSchema)
    .describe('For true-or-twist: 6-8 items. Else [].'),
  fillGaps: z.array(FillGapItemSchema).describe('For fill-gap: 5-7 items. Else [].'),
  scenarios: z.array(ScenarioItemSchema).describe('For scenario: 4-6 items. Else [].'),
  sortBuckets: z
    .array(SortBucketSchema)
    .describe('For speed-sort: 2-4 buckets. Else [].'),
  sortItems: z.array(SortItemSchema).describe('For speed-sort: 8-12 items. Else [].'),
});

export type GenerateLearningGameOutput = z.infer<typeof GenerateLearningGameOutputSchema>;

export const GenerateLearningGameInputSchema = z.object({
  courseTitle: z.string(),
  courseDescription: z.string(),
  lessonTitles: z.array(z.string()).min(1),
  topicFocus: z
    .string()
    .optional()
    .describe('Optional specific topic or lesson title to focus the game on.'),
  gameType: z.enum(LEARNING_GAME_TYPES).describe('Which mini-game format to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export type GenerateLearningGameInput = z.infer<typeof GenerateLearningGameInputSchema>;
