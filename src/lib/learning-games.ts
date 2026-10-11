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

const teachingText = z.string().trim().min(1).max(1400);

export const QuizItemSchema = z.object({
  question: teachingText,
  options: z.array(teachingText).min(2).max(4),
  correctAnswer: teachingText,
  explanation: teachingText,
});

export const MatchPairSchema = z.object({
  term: teachingText,
  definition: teachingText,
});

export const TrueFalseItemSchema = z.object({
  statement: teachingText,
  isTrue: z.boolean(),
  explanation: teachingText,
});

export const FillGapItemSchema = z.object({
  sentence: z
    .string().trim().min(1).max(1400)
    .describe('Sentence with exactly one blank marked as ____'),
  answer: teachingText,
  distractors: z.array(teachingText).min(1).max(3),
  hint: teachingText,
  explanation: teachingText.optional(),
});

export const ScenarioItemSchema = z.object({
  situation: teachingText,
  options: z.array(teachingText).min(2).max(4),
  correctOption: teachingText,
  explanation: teachingText,
});

export const SortBucketSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: teachingText,
});

export const SortItemSchema = z.object({
  text: teachingText,
  correctBucketId: z.string().trim().min(1).max(120),
  explanation: teachingText.optional(),
});

export const GenerateLearningGameOutputSchema = z.object({
  gameType: z.enum(LEARNING_GAME_TYPES),
  title: z.string().trim().min(1).max(160).describe('Catchy game title.'),
  tagline: z.string().trim().min(1).max(240).describe('One short playful line.'),
  topicFocus: teachingText,
  estimatedMinutes: z.number().int().min(3).max(12).describe('Play time estimate 3-12.'),
  xpReward: z.number().int().min(25).max(80).describe('XP between 25 and 80.'),
  instructions: teachingText.describe('2-3 sentences of how to play.'),
  quizItems: z.array(QuizItemSchema).max(8).describe('For quiz-blitz: 5-8 items. Else [].'),
  matchPairs: z.array(MatchPairSchema).max(7).describe('For match-up: 5-7 pairs. Else [].'),
  trueFalseItems: z
    .array(TrueFalseItemSchema).max(8)
    .describe('For true-or-twist: 6-8 items. Else [].'),
  fillGaps: z.array(FillGapItemSchema).max(7).describe('For fill-gap: 5-7 items. Else [].'),
  scenarios: z.array(ScenarioItemSchema).max(6).describe('For scenario: 4-6 items. Else [].'),
  sortBuckets: z
    .array(SortBucketSchema).max(4)
    .describe('For speed-sort: 2-4 buckets. Else [].'),
  sortItems: z.array(SortItemSchema).max(12).describe('For speed-sort: 8-12 items. Else [].'),
});

export type GenerateLearningGameOutput = z.infer<typeof GenerateLearningGameOutputSchema>;

export const GenerateLearningGameInputSchema = z.object({
  courseTitle: z.string().trim().min(1).max(240),
  courseDescription: z.string().trim().min(1).max(4000),
  lessonTitles: z.array(z.string().trim().min(1).max(240)).min(1).max(60),
  lessonMaterial: z.string().max(48000).optional().describe('Canonical lesson material and correct checkpoint answers.'),
  topicFocus: z
    .string().trim().max(500)
    .optional()
    .describe('Optional specific topic or lesson title to focus the game on.'),
  gameType: z.enum(LEARNING_GAME_TYPES).describe('Which mini-game format to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export type GenerateLearningGameInput = z.infer<typeof GenerateLearningGameInputSchema>;

/** Validate semantic game rules after structured generation, before the player receives a deck. */
export function validateGeneratedLearningGame(value: unknown, expectedType?: LearningGameType): GenerateLearningGameOutput {
  const game = GenerateLearningGameOutputSchema.parse(value);
  const fail = (message: string): never => { throw new Error(`Invalid generated game: ${message}`); };
  const unique = (items: string[]) => new Set(items.map(item => item.trim().toLowerCase())).size === items.length;
  if (expectedType && game.gameType !== expectedType) fail('wrong game type');
  const activeKeys: Record<LearningGameType, string[]> = {
    'quiz-blitz': ['quizItems'], 'match-up': ['matchPairs'], 'true-or-twist': ['trueFalseItems'],
    'fill-gap': ['fillGaps'], scenario: ['scenarios'], 'speed-sort': ['sortBuckets', 'sortItems'],
  };
  const counts: Record<string, [number, number]> = {
    quizItems: [5, 8], matchPairs: [5, 7], trueFalseItems: [6, 8], fillGaps: [5, 7],
    scenarios: [4, 6], sortBuckets: [2, 4], sortItems: [8, 12],
  };
  for (const [key, [min, max]] of Object.entries(counts)) {
    const items = game[key as keyof typeof game] as unknown[];
    const active = activeKeys[game.gameType].includes(key);
    if (active ? items.length < min || items.length > max : items.length !== 0) fail(`invalid ${key} count`);
  }
  for (const item of game.quizItems) {
    if (item.options.length < 3 || !unique(item.options) || !item.options.includes(item.correctAnswer)) fail('quiz answer/options');
  }
  for (const item of game.scenarios) {
    if (item.options.length < 3 || !unique(item.options) || !item.options.includes(item.correctOption)) fail('scenario answer/options');
  }
  for (const item of game.fillGaps) {
    const blanks = item.sentence.match(/_{4,}/g) || [];
    if (blanks.length !== 1 || blanks[0] !== '____' || item.distractors.length < 2 || !unique([item.answer, ...item.distractors])) fail('fill-gap blank/options');
  }
  if (!unique(game.quizItems.map(item => item.question)) || !unique(game.scenarios.map(item => item.situation))
    || !unique(game.fillGaps.map(item => item.sentence)) || !unique(game.trueFalseItems.map(item => item.statement))
    || !unique(game.sortItems.map(item => item.text))) fail('duplicate game rounds');
  if (!unique(game.matchPairs.map(pair => pair.term)) || !unique(game.matchPairs.map(pair => pair.definition))) fail('ambiguous match pairs');
  if (game.trueFalseItems.length && (!game.trueFalseItems.some(item => item.isTrue) || !game.trueFalseItems.some(item => !item.isTrue))) fail('true/false balance');
  if (!unique(game.sortBuckets.map(bucket => bucket.id))) fail('duplicate sort buckets');
  if (!unique(game.sortBuckets.map(bucket => bucket.label))) fail('ambiguous sort bucket labels');
  const bucketIds = new Set(game.sortBuckets.map(bucket => bucket.id));
  if (game.sortItems.some(item => !bucketIds.has(item.correctBucketId))) fail('unknown sort bucket');
  return game;
}
