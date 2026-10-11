import { getCourse, type Lesson } from '@/lib/data-provider';
import type { GenerateLearningGameOutput, LearningGameType } from '@/lib/learning-games';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

type Checkpoint = {
  question: string;
  options: string[];
  correctAnswer: string;
  lesson: Lesson;
  phase: 'practice' | 'assessment';
};

/** Stable arrangement keeps server and browser renders identical. */
export function arrangeChoices<T>(items: T[], seed: string): T[] {
  let hash = 2166136261;
  for (const letter of seed) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  const arranged = [...items];
  for (let index = arranged.length - 1; index > 0; index -= 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 2246822507) >>> 0;
    const target = hash % (index + 1);
    [arranged[index], arranged[target]] = [arranged[target], arranged[index]];
  }
  return arranged;
}

const GAME_NAMES: Record<LearningGameType, string> = {
  'quiz-blitz': 'Checkpoint sprint',
  'match-up': 'Memory bridges',
  'true-or-twist': 'Myth detective',
  'fill-gap': 'Knowledge repair',
  scenario: 'Decision trail',
  'speed-sort': 'Concept compass',
};

function explanation(checkpoint: Checkpoint) {
  return `The lesson “${checkpoint.lesson.title}” teaches this answer: ${checkpoint.correctAnswer}.`;
}

/**
 * Course-backed practice is available without a model or credentials. These
 * cards use only authored checkpoint answers, goals, and takeaways; they are
 * deliberately shorter when the selected lesson contains fewer checkpoints.
 */
export function buildCurriculumGame(
  courseId: string,
  gameType: LearningGameType,
  difficulty: GameDifficulty,
  lessonId = 'all'
): GenerateLearningGameOutput | null {
  const course = getCourse(courseId);
  if (!course) return null;
  const lessons = lessonId === 'all'
    ? course.lessons
    : course.lessons.filter(lesson => lesson.id === lessonId);
  if (!lessons.length) return null;

  const all = lessons.flatMap(lesson => [
    ...lesson.practice.questions.map(question => ({ ...question, lesson, phase: 'practice' as const })),
    ...lesson.assessment.questions.map(question => ({ ...question, lesson, phase: 'assessment' as const })),
  ]);
  const seen = new Set<string>();
  let checkpoints = all.filter(checkpoint => {
    const key = checkpoint.question.trim().toLowerCase();
    if (seen.has(key) || !checkpoint.options.includes(checkpoint.correctAnswer)) return false;
    seen.add(key);
    return new Set(checkpoint.options).size >= 2;
  });
  // Some older courses have learning material but no authored quizzes. Topic
  // recall uses that exact material and actual lesson/project names as choices.
  // It adds no claims about the subject and never impersonates AI output.
  if (!checkpoints.length) {
    const topicNames = course.lessons.map(lesson => lesson.title);
    const projectNames = course.lessons.map(lesson => lesson.project.title);
    const choicesFor = (answer: string, pool: string[]) => {
      const distractors = [...new Set([...pool, course.title, ...topicNames, ...projectNames])]
        .filter(option => option !== answer);
      return [answer, ...arrangeChoices(distractors, answer).slice(0, 3)];
    };
    checkpoints = lessons.flatMap(lesson => {
      const teachingCards: Checkpoint[] = [];
      for (const text of [lesson.introduction.text, ...(lesson.objectives || []), ...(lesson.keyTakeaways || [])]) {
        if (!text.trim()) continue;
        teachingCards.push({ question: `Which learning topic is described here?\n“${text}”`, options: choicesFor(lesson.title, topicNames), correctAnswer: lesson.title, lesson, phase: 'practice' });
      }
      if (lesson.project.description.trim()) {
        teachingCards.push({ question: `Which hands-on project practices this task?\n“${lesson.project.description}”`, options: choicesFor(lesson.project.title, projectNames), correctAnswer: lesson.project.title, lesson, phase: 'assessment' });
      }
      return teachingCards;
    }).filter(checkpoint => checkpoint.options.length >= 2);
  }
  if (!checkpoints.length) return null;

  // Easy uses familiar practice questions, hard starts with assessments and
  // draws a longer pack; choice content stays grounded in the same curriculum.
  const count = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 6 : 8;
  const arranged = arrangeChoices(checkpoints, `${courseId}:${lessonId}:${difficulty}`);
  const ordered = difficulty === 'hard'
    ? [...arranged.filter(item => item.phase === 'assessment'), ...arranged.filter(item => item.phase === 'practice')]
    : difficulty === 'easy'
      ? [...arranged.filter(item => item.phase === 'practice'), ...arranged.filter(item => item.phase === 'assessment')]
      : arranged;
  const selected = ordered.slice(0, count);
  const topicFocus = lessonId === 'all' ? course.title : lessons[0].title;
  const game: GenerateLearningGameOutput = {
    gameType,
    title: GAME_NAMES[gameType],
    tagline: 'Your lesson, a new way to remember it.',
    topicFocus,
    estimatedMinutes: Math.max(3, Math.ceil(selected.length * 0.6)),
    xpReward: difficulty === 'easy' ? 25 : difficulty === 'medium' ? 40 : 60,
    instructions: 'Learn at your own pace. Read the explanation after every choice, then continue. Reach 70% mastery to complete this expedition.',
    quizItems: [], matchPairs: [], trueFalseItems: [], fillGaps: [],
    scenarios: [], sortBuckets: [], sortItems: [],
  };

  if (gameType === 'quiz-blitz') {
    game.quizItems = selected.map(checkpoint => ({
      question: checkpoint.question,
      options: arrangeChoices([...new Set(checkpoint.options)], checkpoint.question),
      correctAnswer: checkpoint.correctAnswer,
      explanation: explanation(checkpoint),
    }));
  }

  if (gameType === 'scenario') {
    game.scenarios = selected.slice(0, 6).map(checkpoint => ({
      situation: `You are helping a teammate review “${checkpoint.lesson.title}”. They ask: ${checkpoint.question} Which answer would you recommend?`,
      options: arrangeChoices([...new Set(checkpoint.options)], checkpoint.question),
      correctOption: checkpoint.correctAnswer,
      explanation: explanation(checkpoint),
    }));
  }

  if (gameType === 'true-or-twist') {
    game.trueFalseItems = selected.flatMap((checkpoint, index) => {
      const wrong = checkpoint.options.find(option => option !== checkpoint.correctAnswer)!;
      const guesses = index % 2 === 0
        ? [checkpoint.correctAnswer, wrong]
        : [wrong, checkpoint.correctAnswer];
      return guesses.map(guess => ({
        statement: `Checkpoint: ${checkpoint.question}\nSuggested answer: “${guess}”`,
        isTrue: guess === checkpoint.correctAnswer,
        explanation: explanation(checkpoint),
      }));
    }).slice(0, 8);
  }

  if (gameType === 'fill-gap') {
    game.fillGaps = selected.slice(0, 7).map(checkpoint => ({
      sentence: `${checkpoint.question}\nComplete the checkpoint answer: ____`,
      answer: checkpoint.correctAnswer,
      distractors: checkpoint.options.filter(option => option !== checkpoint.correctAnswer).slice(0, 3),
      hint: checkpoint.lesson.keyTakeaways?.[0] || checkpoint.lesson.objectives?.[0] || `From “${checkpoint.lesson.title}”.`,
      explanation: explanation(checkpoint),
    }));
  }

  if (gameType === 'match-up') {
    const definitions = new Set<string>();
    game.matchPairs = ordered.filter(checkpoint => {
      if (definitions.has(checkpoint.correctAnswer)) return false;
      definitions.add(checkpoint.correctAnswer);
      return true;
    }).slice(0, 7).map(checkpoint => ({
      term: checkpoint.question,
      definition: checkpoint.correctAnswer,
    }));
    game.instructions = 'Select a checkpoint on the left, then its answer on the right. Every bridge stays open until you understand the match. First-try matches count toward mastery.';
  }

  if (gameType === 'speed-sort') {
    game.sortBuckets = [
      { id: 'supported', label: 'Lesson-supported answer' },
      { id: 'misconception', label: 'Misconception to revise' },
    ];
    game.sortItems = selected.flatMap(checkpoint => {
      const wrong = checkpoint.options.find(option => option !== checkpoint.correctAnswer)!;
      return [
        { text: `${checkpoint.question}\nProposed answer: “${checkpoint.correctAnswer}”`, correctBucketId: 'supported', explanation: explanation(checkpoint) },
        { text: `${checkpoint.question}\nProposed answer: “${wrong}”`, correctBucketId: 'misconception', explanation: explanation(checkpoint) },
      ];
    }).slice(0, 12);
    // No clock or drag dependency: keyboard and touch use the same controls.
    game.instructions = 'Inspect each proposed checkpoint answer and place it in the right category. There is no timer. Pause to understand the feedback before moving on.';
  }
  return game;
}
