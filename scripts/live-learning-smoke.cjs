// Run with: node --env-file=.env.local scripts/live-learning-smoke.cjs
// Credentials remain in process memory. Output is limited to safe result metadata.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.resolve(process.cwd(), 'src', request.slice(2)) : request, ...rest);
};
require.extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error('MissingCredential');
  const { generateTrainingPack } = require('../src/ai/flows/generate-training-pack-flow.ts');
  const { classroomSlideGenerator } = require('../src/ai/flows/classroom-slide-generator-flow.ts');
  const { generateLearningGame } = require('../src/ai/flows/generate-learning-game-flow.ts');
  const { getCourse } = require('../src/lib/data-provider.ts');
  const { lessonMaterialForAI } = require('../src/lib/learning-experience.ts');
  const course = getCourse('masters-codex');
  const lesson = course.lessons.find(item => item.id === '1');
  const run = async (check, operation, metadata) => {
    try {
      const output = await operation();
      console.log(JSON.stringify({ check, ok: true, ...metadata(output) }));
      return true;
    } catch (error) {
      const redact = text => String(text).replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]').replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]');
      const message = redact(error?.message || 'Unknown failure');
      const category = /401|invalid_api_key|authentication|incorrect api key|UNAUTHENTICATED/i.test(message) ? 'authentication'
        : /429|insufficient_quota|quota|rate limit/i.test(message) ? 'quota-or-rate-limit'
        : /output|schema|validation|invalid generated|requested program|could not parse/i.test(message) ? 'structured-output'
        : /fetch failed|ECONN|network|ETIMEDOUT|connection/i.test(message) ? 'network'
        : /timeout|AbortError|abort/i.test(message) ? 'timeout' : 'runtime';
      const stackSource = typeof error?.stack === 'string' ? error.stack.split('\n').filter(line => /^\s*at\s/.test(line)).slice(0, 2).map(redact) : [];
      console.log(JSON.stringify({ check, ok: false, errorType: error?.name || 'Error', category, message: message.slice(0, 250), stackSource, ...(typeof error?.status === 'number' ? { status: error.status } : {}) }));
      process.exitCode = 1;
      return false;
    }
  };
  if (!process.argv.includes('--game-only')) {
    const trainingSucceeded = await run('training',
      () => generateTrainingPack({ courseId: course.id, lessonId: lesson.id, program: 'sprint', difficulty: 'medium' }),
      pack => ({ source: pack.source, quests: pack.quests.length, flashcards: pack.flashcards.length, cheatSheet: pack.cheatSheet.length }));
    if (!trainingSucceeded) return;
    const slidesSucceeded = await run('slides',
      () => classroomSlideGenerator({
        lesson: { id: lesson.id, title: lesson.title, duration: lesson.duration, introduction: lesson.introduction },
        courseContext: { title: course.title, description: course.description, lessons: course.lessons.map(item => ({ id: item.id, title: item.title, duration: item.duration })) },
        learningLevel: 'intermediate', visualStyle: 'interactive', slideCount: 8, deckLength: 'quick', treatment: 'challenge', enrichVisuals: false,
        lessonMaterial: lessonMaterialForAI(lesson),
      }), deck => ({ source: 'openai', slides: deck.slides.length, interactive: deck.interactiveElements.length, treatment: deck.generationConfig.treatment }));
    if (!slidesSucceeded) return;
  }
  await run('game', () => generateLearningGame({
    courseTitle: course.title, courseDescription: course.description, lessonTitles: [lesson.title],
    lessonMaterial: lessonMaterialForAI(lesson), topicFocus: lesson.title, gameType: 'quiz-blitz', difficulty: 'medium',
  }), game => ({ source: 'openai', gameType: game.gameType, rounds: game.quizItems.length }));
}
main().catch(error => { console.log(JSON.stringify({ ok: false, errorType: error?.name || 'Error' })); process.exitCode = 1; });
