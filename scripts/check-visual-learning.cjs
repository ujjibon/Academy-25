// Check authored film coverage, playable mission solvability, and the delivered Blender kit.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
const { buildSketchLessonStoryboard, sketchViewingProgress } = require('../src/lib/visual-lessons.ts');
const { buildLessonLab, createInitialLabState, placeLabPiece, evaluateLab, simulateLab } = require('../src/lib/lesson-labs.ts');
const courses = fs.readdirSync(path.join(root, 'src/data/courses'))
  .filter(name => name.endsWith('.json'))
  .map(name => JSON.parse(fs.readFileSync(path.join(root, 'src/data/courses', name), 'utf8')))
  .filter(course => Array.isArray(course.lessons));
const filmIds = new Set();
const filmFamilies = new Set();
const labFamilies = new Set();
let lessons = 0;
let solvedStages = 0;
let feedbackChecks = 0;
for (const course of courses) for (const lesson of course.lessons) {
  lessons++;
  const film = buildSketchLessonStoryboard(course, lesson);
  assert(!filmIds.has(film.id), 'Every lesson has its own film identity');
  filmIds.add(film.id); filmFamilies.add(film.family);
  assert.equal(film.title, lesson.title, 'The film teaches the selected lesson');
  assert(film.project.title && film.project.description, 'The authored project is present');
  assert.equal(film.chapters.length, 5, 'A complete teaching sequence');
  assert(film.durationInFrames > 30 * 30 && film.durationInFrames < 30 * 480, 'Deeper worked lessons remain under eight minutes');
  let end = 0;
  for (const chapter of film.chapters) {
    assert.equal(chapter.startFrame, end, 'Chapters are contiguous');
    assert(chapter.narration.trim().length > 20, 'Each chapter teaches something');
    end += chapter.durationInFrames;
  }
  assert.equal(end, film.durationInFrames);
  let captionEnd = 0;
  for (const caption of film.captions) {
    assert(caption.text.trim());
    assert(caption.startMs >= captionEnd - 0.01 && caption.endMs > caption.startMs);
    captionEnd = caption.endMs;
  }
  assert.equal(Math.round(captionEnd), Math.round(film.durationInFrames / film.fps * 1000));
  if (film.code) for (const trace of film.code.trace) assert(trace.line >= 0 && trace.line < film.code.lines.length);
  const empty = new Uint8Array(film.durationInFrames);
  assert.equal(sketchViewingProgress(film, empty).complete, false);
  empty[empty.length - 1] = 1;
  assert.equal(sketchViewingProgress(film, empty).complete, false, 'Seeking to the end gives no completion');
  const full = new Uint8Array(film.durationInFrames).fill(1);
  assert.equal(sketchViewingProgress(film, full).complete, true);
  const skipped = full.slice();
  const chapter = film.chapters[0];
  skipped.fill(0, chapter.startFrame, chapter.startFrame + chapter.durationInFrames);
  assert.equal(sketchViewingProgress(film, skipped).complete, false, 'Skipping a chapter cannot complete a film');

  const lab = buildLessonLab(course, lesson); labFamilies.add(lab.family);
  assert.equal(lab.projectTitle, lesson.project.title);
  assert(lab.briefing.trim().length > 20 && lab.lessonPrinciple.trim().length > 10);
  assert.equal(lab.sequence.length, 5);
  assert.equal(new Set(lab.sequence).size, 5);
  assert(lab.sequence.every(id => lab.pieces.some(piece => piece.id === id)));
  const initial = createInitialLabState(lab);
  assert.equal(evaluateLab(lab, initial, 2).passed, false, 'An untouched workshop is not mastered');
  const solved = { slots: [...lab.sequence], first: lab.controls[0].target[0], second: lab.controls[1].target[0], safeguard: true };
  for (let stage = 0; stage < 3; stage++) {
    const result = evaluateLab(lab, solved, stage);
    assert(result.passed && result.score === 100, `${course.id}/${lesson.id} has a solvable stage ${stage}`);
    solvedStages++;
  }
  const wrong = placeLabPiece(solved, 'noise', 0);
  assert.equal(evaluateLab(lab, wrong, 2).passed, false, 'A conflicting piece changes the outcome');
  const moved = placeLabPiece(solved, lab.sequence[0], 2);
  assert.equal(moved.slots.filter(id => id === lab.sequence[0]).length, 1, 'Pieces move rather than duplicate');
  assert.equal(evaluateLab(lab, { ...solved, safeguard: false }, 2).passed, false, 'The delivery safeguard matters');
  assert.notEqual(simulateLab(lab, initial).output, simulateLab(lab, solved).output, 'Actions change the visible experiment');
  for (const control of lab.controls) {
    const outside = control.min < control.target[0] ? control.min : control.max;
    const offTarget = { ...solved, [control.key]: outside };
    assert.equal(evaluateLab(lab, offTarget, 2).passed, false, 'An out-of-range experiment is not mastered');
    assert.notEqual(simulateLab(lab, offTarget).consequence, simulateLab(lab, solved).consequence, 'Live feedback respects the actual lesson mission range');
    feedbackChecks++;
  }
}
assert.equal(filmFamilies.size, 6, 'All six sketch visual families are covered');
assert.equal(labFamilies.size, 6, 'All six workshop families are covered');
const bytes = fs.readFileSync(path.join(root, 'public/models/academy/lesson-lab-kit.glb'));
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(8), bytes.length);
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
for (const prefix of ['Prompt_', 'Video_', 'Code_', 'Research_', 'Design_', 'Creative_']) {
  assert(gltf.nodes.some(node => node.name?.startsWith(prefix)), `A Blender workshop exists for ${prefix}`);
}
let triangles = 0;
for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
  const positions = gltf.accessors[primitive.attributes.POSITION];
  assert(positions.min.every(Number.isFinite) && positions.max.every(Number.isFinite));
  triangles += (primitive.indices === undefined ? positions.count : gltf.accessors[primitive.indices].count) / 3;
}
assert(triangles < 35000 && bytes.length < 2 * 1024 * 1024, 'The 3D kit meets its runtime budget');
assert(fs.existsSync(path.join(root, 'assets/academy/lesson-lab-kit.blend')), 'Editable Blender source is delivered');
assert(fs.existsSync(path.join(root, 'public/models/academy/lesson-lab-kit-preview.png')), 'A real rendered fallback is delivered');
console.log(JSON.stringify({ courses: courses.length, lessons, films: filmIds.size, filmFamilies: [...filmFamilies], labFamilies: [...labFamilies], solvedStages, feedbackChecks, blenderTriangles: triangles, blenderBytes: bytes.length }));
