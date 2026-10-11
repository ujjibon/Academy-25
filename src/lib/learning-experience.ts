import { z } from 'zod';
import type { Course, Lesson } from '@/lib/data-provider';

export const LearningContentIdSchema = z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/);
export const TRAINING_PROGRAMS = ['sprint', 'deep-dive', 'project'] as const;
export const LEARNING_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const SLIDE_DECK_LENGTHS = ['quick', 'standard', 'deep-dive'] as const;
export const SLIDE_TREATMENTS = ['visual', 'workshop', 'challenge'] as const;
export const SLIDE_DECK_COUNTS = { quick: 8, standard: 14, 'deep-dive': 22 } as const;
export type SlideDeckLength = (typeof SLIDE_DECK_LENGTHS)[number];
export type SlideTreatment = (typeof SLIDE_TREATMENTS)[number];

export const TrainingPackRequestSchema = z.object({
  courseId: LearningContentIdSchema,
  lessonId: LearningContentIdSchema,
  goal: z.string().trim().max(500).optional(),
  difficulty: z.enum(LEARNING_DIFFICULTIES).default('medium'),
  program: z.enum(TRAINING_PROGRAMS).default('sprint'),
});

export type TrainingPackRequest = z.infer<typeof TrainingPackRequestSchema>;
export type TrainingPackOptions = Partial<Pick<TrainingPackRequest, 'goal' | 'difficulty' | 'program'>>;

export const TrainingPackContentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  missionBrief: z.string().trim().min(1).max(1800),
  estimatedMinutes: z.number().int().min(5).max(180),
  quests: z.array(z.object({
    id: LearningContentIdSchema,
    title: z.string().trim().min(1).max(160),
    instructions: z.string().trim().min(1).max(1800),
    successCriteria: z.array(z.string().trim().min(1).max(400)).min(1).max(4),
    xpReward: z.number().int().min(15).max(100),
  })).min(3).max(6),
  flashcards: z.array(z.object({
    front: z.string().trim().min(1).max(700),
    back: z.string().trim().min(1).max(1200),
  })).min(4).max(10),
  cheatSheet: z.array(z.object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(1800),
  })).min(3).max(8),
  reflectionPrompts: z.array(z.string().trim().min(1).max(500)).min(2).max(4),
});

export const TrainingPackSchema = TrainingPackContentSchema.extend({
  source: z.enum(['openai', 'lesson']),
});

export type TrainingPack = z.infer<typeof TrainingPackSchema>;

/** Curriculum-only materials remain useful when a learner is offline or AI is unavailable. */
export function createLessonTrainingPack(
  course: Pick<Course, 'title'>,
  lesson: Lesson,
  options: TrainingPackOptions = {},
): TrainingPack {
  const program = options.program ?? 'sprint';
  const difficulty = options.difficulty ?? 'medium';
  const xp = difficulty === 'hard' ? 70 : difficulty === 'easy' ? 30 : 50;
  const objectives = lesson.objectives?.filter(Boolean) ?? [];
  const takeaways = lesson.keyTakeaways?.filter(Boolean) ?? [];
  const questions = [...lesson.practice.questions, ...lesson.assessment.questions]
    .filter((question, index, all) => all.findIndex(other => other.question === question.question) === index);
  const label = program === 'deep-dive' ? 'Mastery expedition' : program === 'project' ? 'Build mission' : 'Skill sprint';
  const quest = (id: string, title: string, instructions: string, successCriteria: string[], xpReward = xp) => ({
    id, title: title.slice(0, 160), instructions: instructions.slice(0, 1800),
    successCriteria: successCriteria.slice(0, 4).map(item => item.slice(0, 400)), xpReward,
  });
  const quests = [
    quest('decode', 'Decode the mission',
      `Read ${lesson.title}. Close your notes and explain the main idea in your own words. ${difficulty === 'hard' ? 'Add a concrete counterexample and explain its limits.' : 'Use one concrete example to make the idea clear.'}`,
      [objectives[0] || `Explain the main idea of ${lesson.title}.`, 'Record your explanation before checking the lesson.']),
    quest('checkpoint', 'Clear the knowledge checkpoint',
      `Complete the lesson practice. For each missed answer, compare your choice with the correct answer and explain what you will change next time.`,
      ['Attempt every practice question.', 'Write a correction for any missed concept.']),
  ];
  if (program === 'deep-dive') {
    quests.push(quest('map', 'Build your concept map',
      `Connect the learning objectives to the project brief for ${lesson.project.title}. Use the lesson takeaways as labels and show how each helps the finished artifact.`,
      ['Connect at least two ideas from the lesson.', 'Explain each connection in your own words.']));
  }
  if (program !== 'sprint') {
    const activity = lesson.activities?.[0];
    quests.push(quest('lab', activity?.title || 'Run a focused experiment',
      activity?.description || `Try a small part of ${lesson.project.title}. Keep a before-and-after note describing what changed and what you learned.`,
      ['Save evidence of your attempt.', 'Describe one decision and the reason for it.']));
  }
  quests.push(quest('build', lesson.project.title,
    `${lesson.project.description}${program === 'sprint' ? ' Start with a small draft that demonstrates the central concept.' : ' Create the full artifact, then check it against the lesson objectives.'}`,
    ['Create an artifact that follows the project brief.', objectives[objectives.length - 1] || 'Explain how your artifact applies the lesson.'], Math.min(100, xp + 20)));
  if (program === 'deep-dive') {
    quests.push(quest('transfer', 'Pass the transfer challenge',
      `Complete the lesson assessment without your notes. Explain how you could use ${lesson.title} in another task, and record any idea you still need to revisit.`,
      ['Complete the assessment.', 'Describe one new use and one remaining question.']));
  }
  const flashcards = questions.slice(0, program === 'sprint' ? 6 : 10).map(question => ({
    front: question.question.slice(0, 700), back: question.correctAnswer.slice(0, 1200),
  }));
  const extraCards = [
    { front: 'What is the project you are building?', back: `${lesson.project.title}: ${lesson.project.description}` },
    { front: 'What is the central idea of this lesson?', back: lesson.introduction.text },
    { front: 'What should you be able to explain after this lesson?', back: objectives.join(' • ') || lesson.title },
    { front: 'Which ideas should you remember?', back: takeaways.join(' • ') || lesson.introduction.text },
  ];
  while (flashcards.length < 4) {
    const card = extraCards[flashcards.length];
    flashcards.push({ front: card.front, back: card.back.slice(0, 1200) });
  }
  return TrainingPackSchema.parse({
    title: `${label}: ${lesson.title}`.slice(0, 160),
    missionBrief: `${course.title} / ${lesson.title}. ${lesson.introduction.text}${options.goal?.trim() ? ` Your goal: ${options.goal.trim()}` : ''}`.slice(0, 1800),
    estimatedMinutes: Math.round(Math.min(180, Math.max(5, program === 'sprint' ? Math.min(20, lesson.duration) : program === 'project' ? lesson.duration + 15 : lesson.duration * 2))),
    quests,
    flashcards,
    cheatSheet: [
      { title: 'Core idea', body: lesson.introduction.text.slice(0, 1800) },
      { title: 'Learning targets', body: (objectives.join('\n') || `Explain ${lesson.title} and apply it in the lesson project.`).slice(0, 1800) },
      { title: lesson.project.title.slice(0, 160), body: lesson.project.description.slice(0, 1800) },
      ...(takeaways.length ? [{ title: 'Keep these in mind', body: takeaways.join('\n').slice(0, 1800) }] : []),
    ],
    reflectionPrompts: [
      `Which decision in ${lesson.project.title} best demonstrates what you learned?`,
      'Which checkpoint was hardest, and what evidence would help you answer it confidently?',
      ...(program === 'deep-dive' ? ['How could you apply this lesson in a new situation? Give a concrete example.'] : []),
    ],
    source: 'lesson',
  });
}

/** Bounded, canonical lesson content for generators; answers help keep teaching feedback accurate. */
export function lessonMaterialForAI(lesson: Lesson): string {
  return JSON.stringify({
    title: lesson.title,
    introduction: lesson.introduction.text.slice(0, 12000),
    objectives: lesson.objectives?.slice(0, 10),
    keyTakeaways: lesson.keyTakeaways?.slice(0, 10),
    activities: lesson.activities?.slice(0, 8),
    project: lesson.project,
    practice: lesson.practice.questions.slice(0, 12),
    assessment: lesson.assessment.questions.slice(0, 12),
  }).slice(0, 24000);
}
