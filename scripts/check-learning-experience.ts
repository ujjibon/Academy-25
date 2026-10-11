import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { courses } from '../src/lib/courses';
import { getCourse } from '../src/lib/data-provider';
import {
  createLessonTrainingPack, TrainingPackSchema, TrainingPackRequestSchema,
  TRAINING_PROGRAMS, LEARNING_DIFFICULTIES, SLIDE_DECK_COUNTS, SLIDE_TREATMENTS,
} from '../src/lib/learning-experience';
import { createLessonSlideDeck } from '../src/lib/lesson-slide-deck';
import { buildCurriculumGame } from '../src/lib/curriculum-games';
import { LEARNING_GAME_TYPES, GenerateLearningGameOutputSchema, validateGeneratedLearningGame } from '../src/lib/learning-games';

async function main() {
  let lessonCount = 0;
  let packCount = 0;
  let deckCount = 0;
  let gameCount = 0;
  const missingGames: string[] = [];
  for (const courseInfo of courses) {
    const course = getCourse(courseInfo.id);
    assert.ok(course, `Missing canonical course ${courseInfo.id}`);
    for (const lesson of course.lessons) {
      lessonCount++;
      for (const program of TRAINING_PROGRAMS) for (const difficulty of LEARNING_DIFFICULTIES) {
        const pack = TrainingPackSchema.parse(createLessonTrainingPack(course, lesson, { program, difficulty }));
        assert.equal(pack.source, 'lesson');
        assert.equal(new Set(pack.quests.map(quest => quest.id)).size, pack.quests.length);
        assert.ok(pack.cheatSheet.some(section => section.body.includes(lesson.project.description.slice(0, 20))));
        packCount++;
      }
      for (const [deckLength, count] of Object.entries(SLIDE_DECK_COUNTS)) for (const treatment of SLIDE_TREATMENTS) {
        const deck = createLessonSlideDeck(course, lesson, { deckLength: deckLength as keyof typeof SLIDE_DECK_COUNTS, treatment });
        assert.equal(deck.slides.length, count);
        assert.equal(deck.slides[0].type, 'introduction');
        assert.equal(deck.slides.at(-1)?.type, 'summary');
        assert.equal(new Set(deck.slides.map(slide => slide.id)).size, count);
        assert.ok(deck.slides.some(slide => slide.content.includes(lesson.project.description.slice(0, 20))));
        assert.equal(deck.totalDuration, deck.slides.reduce((sum, slide) => sum + slide.duration, 0));
        deckCount++;
      }
      for (const gameType of LEARNING_GAME_TYPES) {
        const game = buildCurriculumGame(course.id, gameType, 'medium', lesson.id);
        if (!game) { missingGames.push(`${course.id}/${lesson.id}/${gameType}`); continue; }
        GenerateLearningGameOutputSchema.parse(game);
        gameCount++;
      }
    }
  }
  assert.equal(TrainingPackRequestSchema.safeParse({ courseId: '../outside', lessonId: '1' }).success, false);
  assert.equal(TrainingPackRequestSchema.safeParse({ courseId: 'masters-codex', lessonId: '1', goal: 'x'.repeat(501) }).success, false);
  const quiz = buildCurriculumGame('masters-codex', 'quiz-blitz', 'medium', '1');
  assert.ok(quiz);
  validateGeneratedLearningGame(quiz, 'quiz-blitz');
  assert.throws(() => validateGeneratedLearningGame({ ...quiz, quizItems: quiz.quizItems.map((item, index) => index ? item : { ...item, correctAnswer: 'not an option' }) }));
  assert.throws(() => validateGeneratedLearningGame({ ...quiz, gameType: 'scenario' }));
  assert.throws(() => validateGeneratedLearningGame({ ...quiz, xpReward: 100000 }));

  console.log(JSON.stringify({ lessons: lessonCount, trainingPacks: packCount, slideDecks: deckCount, curriculumGames: gameCount, missingGames: missingGames.length, structuralChecks: 'passed' }));
  if (process.argv.includes('--structure-only')) {
    assert.equal(missingGames.length, 0, `Missing curriculum games: ${missingGames.slice(0, 12).join(', ')}`);
    return;
  }

  // Exercise recovery and rejection without reading credentials or making model calls.
  process.env.OPENAI_API_KEY = '';
  const { POST: trainingPost } = await import('../src/app/api/ai/training-pack/route');
  const { POST: slidesPost, GET: slidesGet } = await import('../src/app/api/ai/classroom-slides/route');
  const { POST: gamePost } = await import('../src/app/api/ai/generate-learning-game/route');
  const request = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await trainingPost(request('/api/ai/training-pack', { courseId: 'missing', lessonId: '1' }))).status, 404);
  assert.equal((await trainingPost(request('/api/ai/training-pack', { courseId: 'masters-codex', lessonId: '1', program: 'invalid' }))).status, 400);
  const trainingResponse = await trainingPost(request('/api/ai/training-pack', { courseId: 'masters-codex', lessonId: '1', program: 'project' }));
  assert.equal(trainingResponse.status, 200);
  assert.equal(TrainingPackSchema.parse(await trainingResponse.json()).source, 'lesson');
  const course = getCourse('masters-codex')!;
  const lesson = course.lessons[0];
  const slideBody = { courseId: course.id, lesson, courseContext: course, learningLevel: 'intermediate', visualStyle: 'interactive', slideCount: 22, deckLength: 'deep-dive', treatment: 'challenge', forceRegenerate: true };
  const slidesResponse = await slidesPost(request('/api/ai/classroom-slides', slideBody));
  assert.equal(slidesResponse.status, 200);
  const deck = await slidesResponse.json();
  assert.equal(deck.source, 'lesson');
  assert.equal(deck.slides.length, 22);
  assert.equal(deck.generationConfig.treatment, 'challenge');
  assert.equal((await slidesGet(new NextRequest('http://localhost/api/ai/classroom-slides?courseId=../outside&lessonId=1'))).status, 400);
  assert.equal((await gamePost(request('/api/ai/generate-learning-game', { courseId: course.id, lessonId: lesson.id, gameType: 'quiz-blitz', difficulty: 'medium' }))).status, 503);
  assert.equal((await gamePost(request('/api/ai/generate-learning-game', { courseId: course.id, lessonId: 'missing', gameType: 'quiz-blitz' }))).status, 404);
  console.log(JSON.stringify({ lessons: lessonCount, trainingPacks: packCount, slideDecks: deckCount, curriculumGames: gameCount, missingGames: missingGames.length, semanticRejections: 5, recoveryAndRequestChecks: 8 }));
  assert.equal(missingGames.length, 0, `Missing playable curriculum games: ${missingGames.slice(0, 12).join(', ')}`);
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Learning validation failed'); process.exitCode = 1; });
