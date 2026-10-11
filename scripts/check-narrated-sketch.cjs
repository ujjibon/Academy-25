// Offline timing and request-safety checks against every authored lesson.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { buildSketchLessonStoryboard } = require('../src/lib/visual-lessons.ts');
const { applySketchNarration, isNarratedSketchManifest, SKETCH_NARRATION_LEAD_MS, SKETCH_NARRATION_TRAIL_MS } = require('../src/lib/narrated-sketch.ts');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const copy = value => structuredClone(value);
const words = value => value.trim().split(/\s+/).filter(Boolean);
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
};
const close = (actual, expected, message) => assert(Math.abs(actual - expected) < 0.00001, `${message}: ${actual} vs ${expected}`);
function manifestFor(course, lesson, film) {
  return {
    id: hash(`manifest:${film.id}`), courseId: course.id, lessonId: Number(lesson.id), generated: true,
    chapters: film.chapters.map((chapter, index) => ({
      id: chapter.id, url: `/api/learning/narration/audio/${hash(`${film.id}:${chapter.id}`)}`,
      // Distinct fractional WAV durations exercise frame quantization as well
      // as pacing determined by the actual spoken chapter, not a fixed slide.
      durationMs: 4800.25 + words(chapter.narration).length * (172 + index * 13),
    })),
  };
}
let lessons = 0, captionChecks = 0, rejects = 0;
const courses = fs.readdirSync(path.join(root, 'src/data/courses'))
  .filter(name => name.endsWith('.json'))
  .map(name => JSON.parse(fs.readFileSync(path.join(root, 'src/data/courses', name), 'utf8')))
  .filter(course => Array.isArray(course.lessons));
let fixture;
for (const course of courses) for (const lesson of course.lessons) {
  const base = freeze(buildSketchLessonStoryboard(course, lesson));
  const manifest = freeze(manifestFor(course, lesson, base));
  const before = JSON.stringify({ base, manifest });
  assert(isNarratedSketchManifest(manifest, course.id, Number(lesson.id)), `A valid generated manifest is accepted for ${course.id}:${lesson.id}`);
  // Order in an API response cannot change the authored teaching sequence.
  const result = applySketchNarration(base, { ...manifest, chapters: [...manifest.chapters].reverse() });
  assert.equal(JSON.stringify({ base, manifest }), before, 'Retiming preserves its inputs');
  assert.notEqual(result, base);
  assert.notEqual(result.project, base.project);
  assert.notEqual(result.labels, base.labels);
  assert.deepEqual(result.labels, base.labels);
  assert.deepEqual(result.project, base.project);
  if (base.code) { assert.notEqual(result.code.lines, base.code.lines); assert.notEqual(result.code.trace[0], base.code.trace[0]); }
  for (const key of ['id', 'title', 'courseTitle', 'family', 'variant', 'fps', 'principle', 'workedExample']) assert.equal(result[key], base[key]);
  assert.deepEqual(result.chapters.map(chapter => chapter.narration), base.chapters.map(chapter => chapter.narration));
  assert.deepEqual(result.captions.map(caption => caption.text), base.captions.map(caption => caption.text));
  assert.deepEqual(words(result.captions.map(caption => caption.text).join(' ')), words(base.chapters.map(chapter => chapter.narration).join(' ')), 'Every authored word survives');
  let endFrame = 0, captionEnd = 0;
  for (const chapter of result.chapters) {
    const recording = manifest.chapters.find(item => item.id === chapter.id);
    const startMs = chapter.startFrame / result.fps * 1000;
    const endMs = (chapter.startFrame + chapter.durationInFrames) / result.fps * 1000;
    assert.equal(chapter.startFrame, endFrame, 'Chapters are contiguous integer frames');
    assert(Number.isInteger(chapter.durationInFrames) && chapter.durationInFrames > 0);
    assert.equal(chapter.durationInFrames, Math.ceil((recording.durationMs + 1300) * result.fps / 1000));
    endFrame += chapter.durationInFrames;
    const owned = result.captions.filter(caption => caption.startMs >= startMs && caption.endMs <= endMs);
    assert(owned.length > 0);
    const speechStart = startMs + SKETCH_NARRATION_LEAD_MS;
    const speechEnd = speechStart + recording.durationMs;
    close(owned[0].startMs, speechStart, 'Caption starts when speech starts');
    close(owned.at(-1).endMs, speechEnd, 'Caption ends when speech ends');
    assert(endMs >= speechEnd + SKETCH_NARRATION_TRAIL_MS - 0.00001, 'Audio is never clipped by the next chapter');
    assert(endMs - speechEnd - SKETCH_NARRATION_TRAIL_MS < 1000 / result.fps + 0.00001, 'Rounding adds at most one frame');
    const wordCount = owned.reduce((sum, caption) => sum + words(caption.text).length, 0);
    for (const caption of owned) {
      assert(caption.startMs >= captionEnd && caption.endMs > caption.startMs, 'Caption intervals are positive and disjoint');
      close(caption.endMs - caption.startMs, recording.durationMs * words(caption.text).length / wordCount, 'A shorter caption gets proportionally less speech time');
      assert.equal(caption.timestampMs, null); assert.equal(caption.confidence, null);
      captionEnd = caption.endMs; captionChecks++;
    }
  }
  assert.equal(result.durationInFrames, endFrame);
  assert(result.durationInFrames / result.fps * 1000 <= 15 * 60 * 1000);
  assert.deepEqual(applySketchNarration(result, manifest), result, 'Retiming a retimed storyboard is stable');
  if (!fixture) fixture = { course, lesson, base, manifest };
  lessons++;
}
assert.equal(lessons, 84, 'Every catalog lesson is covered');
const { course, lesson, base, manifest } = fixture;
function rejected(value, message, expectedCourse = course.id, expectedLesson = Number(lesson.id)) {
  assert.equal(isNarratedSketchManifest(value, expectedCourse, expectedLesson), false, message);
  assert.throws(() => applySketchNarration(base, value), /narration.*lesson|lesson.*narration/i, 'Invalid requests report a friendly regeneration error');
  rejects++;
}
for (const value of [null, undefined, [], 'manifest', 1, true, {}]) rejected(value, 'Non-manifest inputs are rejected');
for (const [field, value] of [
  ['id', 'x'.repeat(64)], ['id', 'a'.repeat(63)], ['id', 'a'.repeat(65)], ['id', 'A'.repeat(64)],
  ['generated', false], ['generated', 'true'], ['courseId', 'another-course'], ['lessonId', Number(lesson.id) + 1], ['lessonId', String(lesson.id)],
]) rejected({ ...manifest, [field]: value }, `Tampered ${field} is rejected`);
rejected({ ...manifest, chapters: [] }, 'Missing chapters are rejected');
rejected({ ...manifest, chapters: [...manifest.chapters, manifest.chapters[0]] }, 'Additional chapters are rejected');
rejected({ ...manifest, chapters: manifest.chapters.map((chapter, index) => index === 1 ? { ...chapter, id: 'overview' } : chapter) }, 'Duplicate chapters are rejected');
rejected({ ...manifest, chapters: manifest.chapters.map((chapter, index) => index ? chapter : { ...chapter, id: 'unknown' }) }, 'Unknown chapter ids are rejected');
for (const url of [
  'https://example.com/audio.wav', '//example.com/audio.wav', `https://localhost/api/learning/narration/audio/${hash('unsafe')}`,
  `/api/learning/narration/audio/${hash('unsafe')}?token=1`, `/api/learning/narration/audio/${hash('unsafe')}#fragment`,
  '/api/learning/narration/audio/../private', '/api/learning/narration/audio/%2e%2e', `/api/learning/narration/audio/${'g'.repeat(64)}`,
  `/api/learning/narration/audio/${hash('unsafe')}/`, `/api/learning/narration/audio/${'a'.repeat(63)}`, 'data:audio/wav;base64,AAAA',
]) rejected({ ...manifest, chapters: manifest.chapters.map((chapter, index) => index ? chapter : { ...chapter, url }) }, 'Audio paths stay same-origin and canonical');
for (const durationMs of [NaN, Infinity, -Infinity, 0, 499.999, 180000.001, '1000', null]) {
  rejected({ ...manifest, chapters: manifest.chapters.map((chapter, index) => index ? chapter : { ...chapter, durationMs }) }, 'Speech duration is finite and bounded');
}
for (const durationMs of [500, 180000]) {
  const boundary = { ...manifest, chapters: manifest.chapters.map((chapter, index) => index ? chapter : { ...chapter, durationMs }) };
  assert(isNarratedSketchManifest(boundary, course.id, Number(lesson.id)), 'Per-chapter duration boundaries are inclusive');
  assert(applySketchNarration(base, boundary).durationInFrames > 0);
}
const maxLength = { ...manifest, chapters: manifest.chapters.map(chapter => ({ ...chapter, durationMs: 178700 })) };
assert(isNarratedSketchManifest(maxLength, course.id, Number(lesson.id)), 'Exactly fifteen padded minutes is allowed');
assert.equal(applySketchNarration(base, maxLength).durationInFrames / base.fps * 1000, 900000);
rejected({ ...maxLength, chapters: maxLength.chapters.map((chapter, index) => index ? chapter : { ...chapter, durationMs: chapter.durationMs + 0.001 }) }, 'The total duration bound is enforced');
for (const expected of [['../private', 1], ['', 1], [course.id, 0], [course.id, 1.5], [course.id, 100001], [course.id, Infinity]]) {
  assert.equal(isNarratedSketchManifest(manifest, ...expected), false, 'Expected lesson identity is itself validated'); rejects++;
}
for (const fps of [0, 29.97, NaN, 121]) { assert.throws(() => applySketchNarration({ ...base, fps }, manifest), /narration/); rejects++; }
assert.throws(() => applySketchNarration({ ...base, id: `${course.id}:01` }, manifest), /narration/); rejects++;
assert.throws(() => applySketchNarration({ ...base, captions: [{ ...base.captions[0], text: 'Missing teaching material' }, ...base.captions.slice(1)] }, manifest), /narration/); rejects++;
assert.throws(() => applySketchNarration({ ...base, chapters: base.chapters.map((chapter, index) => index ? chapter : { ...chapter, startFrame: 1 }) }, manifest), /narration/); rejects++;
assert.throws(() => applySketchNarration({ ...base, captions: base.captions.map((caption, index) => index ? caption : { ...caption, endMs: 100000 }) }, manifest), /narration/); rejects++;
const captionless = applySketchNarration({ ...base, captions: [] }, manifest);
assert.deepEqual(words(captionless.captions.map(caption => caption.text).join(' ')), words(base.chapters.map(chapter => chapter.narration).join(' ')), 'Sentence fallback keeps every authored word');
const fps24 = applySketchNarration({ ...base, fps: 24, durationInFrames: base.chapters.reduce((sum, chapter) => sum + chapter.durationInFrames, 0), captions: [] }, manifest);
assert.equal(fps24.fps, 24, 'The original integer fps is preserved');
const agentCourse = courses.find(item => item.id === 'masters-antigravity');
const agentFilm = buildSketchLessonStoryboard(agentCourse, agentCourse.lessons[0]);
assert(!agentFilm.labels.some(label => label.detail === 'Introduce subtle breakages at scale'), 'A warning answer cannot become isolated advice');
assert(!agentFilm.chapters.find(chapter => chapter.id === 'build').narration.includes('Introduce subtle breakages at scale'), 'Narration must preserve the meaning of teaching material');
console.log(`PASS: ${lessons} narrated storyboards, ${captionChecks} caption intervals, ${rejects} rejected tampering/boundary cases; exact authored text, immutable inputs, sequential frames, and safe audio URLs.`);
