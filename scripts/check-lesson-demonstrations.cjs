// Independently execute the fixed, authored examples and check curriculum coverage.
// This script never accepts or runs learner-supplied code.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { getLessonDemonstration, authoredLessonDemonstrationIds } = require('../src/lib/lesson-demonstrations.ts');
const root = path.resolve(__dirname, '..');
const courses = fs.readdirSync(path.join(root, 'src/data/courses')).filter(name => name.endsWith('.json')).map(name => JSON.parse(fs.readFileSync(path.join(root, 'src/data/courses', name), 'utf8')));
const demonstrations = new Map();
let steps = 0, experiments = 0, programs = 0, jsPrograms = 0, pythonPrograms = 0, jsxPrograms = 0;
const concepts = new Set(), improvements = new Set();
const pythonCandidates = [process.env.LESSON_CHECK_PYTHON, process.env.USERPROFILE && path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'), 'python3', 'python'].filter(Boolean);
const python = pythonCandidates.find(candidate => { const check = spawnSync(candidate, ['--version'], { encoding: 'utf8', timeout: 5000, windowsHide: true }); return check.status === 0; });
assert(python, 'A Python runtime is required to independently execute the authored Python fixtures (LESSON_CHECK_PYTHON can provide it)');

function finalOutput(code) { return code.trace.at(-1).output; }
function checkProgram(code, key) {
  assert(code.lines.length > 1 && code.lines.length <= 10, `${key}: concise readable code`);
  assert(code.lines.every(line => line.length <= 60), `${key}: code fits the sketch screen`);
  assert(code.trace.length >= 2, `${key}: a causal trace, not only a final value`);
  for (const step of code.trace) {
    assert(Number.isInteger(step.line) && step.line >= 0 && step.line < code.lines.length, `${key}: valid zero-based line ${step.line}`);
    assert(step.state.length > 0 && step.explanation.length > 20, `${key}: visible state and causal explanation`);
  }
  assert(finalOutput(code).length > 0, `${key}: visible final result`);
  if (code.language === 'javascript') {
    const output = [];
    vm.runInNewContext(code.lines.join('\n'), { console: { log: (...values) => output.push(values.map(String).join(' ')) } }, { timeout: 1000 });
    assert.equal(output.join('\n'), finalOutput(code), `${key}: actual JavaScript output matches the independently executed fixture`);
    jsPrograms++;
  } else if (code.language === 'python') {
    const result = spawnSync(python, ['-I', '-c', code.lines.join('\n')], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    assert.equal(result.status, 0, `${key}: Python fixture executes: ${result.stderr}`);
    const output = result.stdout.replace(/\r\n/g, '\n').replace(/\n$/, '');
    assert.equal(output, finalOutput(code), `${key}: actual Python output matches the trace`);
    pythonPrograms++;
  } else if (code.language === 'jsx') {
    const createElement = (type, props, ...children) => typeof type === 'function' ? type({ ...props, children }) : { type, children };
    const render = value => typeof value === 'object' && value !== null ? `<${value.type}>${value.children.map(render).join('')}</${value.type}>` : String(value);
    const source = ts.transpileModule(code.lines.join('\n'), { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
    const output = vm.runInNewContext(`${source}\n;typeof heading !== 'undefined' ? [heading] : typeof element !== 'undefined' ? [element] : [save, cancel];`, { React: { createElement } }, { timeout: 1000 });
    const markup = output.map(render).join('\n');
    const expected = finalOutput(code);
    assert.equal(expected.includes('<') ? markup : markup.replace(/<[^>]+>/g, ''), expected, `${key}: illustrative JSX render matches the trace`);
    jsxPrograms++;
  } else if (code.language === 'css') {
    const text = code.lines.join('\n');
    assert(text.includes('display: flex;') && text.includes('justify-content: space-between;') && text.includes('gap: 16px;'));
    assert(code.trace.at(-1).line === code.lines.findIndex(line => line.includes('gap:')), `${key}: the final gap declaration is explained`);
  } else assert.fail(`${key}: unverified code language ${code.language}`);
  programs++;
}

for (const course of courses) for (const lesson of course.lessons) {
  const key = `${course.id}:${lesson.id}`;
  const demo = getLessonDemonstration(course, lesson);
  demonstrations.set(key, demo);
  assert.equal(demo.id, `demonstration:${key}`);
  assert(demo.goal.length > 40 && demo.concept.length > 60 && demo.why.length > 60, `${key}: substantive instruction`);
  assert(!concepts.has(demo.concept), `${key}: a topic-specific concept`); concepts.add(demo.concept);
  assert(demo.steps.length >= 3 && demo.steps.length <= 5);
  for (const step of demo.steps) {
    assert(step.title.length > 5 && step.action.length > 15 && step.reason.length > 25 && step.visibleResult.length > 0, `${key}: action, reason, and visible artifact`);
    steps++;
  }
  assert(demo.misconception.belief !== demo.misconception.correction && demo.misconception.correction.length > 50);
  assert(demo.prediction.options.length >= 3 && new Set(demo.prediction.options).size === demo.prediction.options.length);
  assert(demo.prediction.options.includes(demo.prediction.answer));
  assert(demo.prediction.explanation.length > 50, `${key}: prediction explains causality`);
  assert(demo.prompt.improved.length > demo.prompt.starter.length + 80 && demo.prompt.sampleOutput.length > 20 && demo.prompt.whyBetter.length > 50, `${key}: constrained prompt and explained sample`);
  assert(!improvements.has(demo.prompt.improved), `${key}: unique prompt contract`); improvements.add(demo.prompt.improved);
  assert(demo.transfer.length > 45);
  assert(demo.experiments.length >= 2 && new Set(demo.experiments.map(example => example.input)).size === demo.experiments.length);
  for (const example of demo.experiments) {
    assert(example.label.length > 5 && example.result.length > 0 && example.reason.length > 25);
    experiments++;
  }
  if (demo.code) {
    checkProgram(demo.code, key);
    for (const experiment of demo.experiments) {
      assert(experiment.lines && experiment.trace, `${key}: every coding comparison has its own truthful worked trace`);
      checkProgram({ language: demo.code.language, lines: experiment.lines, trace: experiment.trace }, `${key}/${experiment.id}`);
    }
  }
}
assert.equal(demonstrations.size, 84);
assert.deepEqual(new Set(authoredLessonDemonstrationIds()), new Set(demonstrations.keys()), 'Every catalog lesson is authored exactly once');
assert.equal(steps, 252);
assert.equal(experiments, 168);
assert.equal(programs, 75);
assert.equal(jsPrograms, 39);
assert.equal(pythonPrograms, 27);
assert.equal(jsxPrograms, 6);

const demo = key => demonstrations.get(key);
// Independent semantic fixtures: these expectations come from the subject, not a generated reference answer.
assert.equal(demo('Python-SP-101:2').prediction.answer, 'adult', 'Age 18 is excluded by < 18');
assert.equal(demo('Python-SP-101:3').prediction.answer, '1', 'A first-item match with break exits after one visit');
assert.equal(demo('Python-SP-101:4').prediction.answer, '3', 'Default split groups consecutive whitespace');
assert.equal(demo('Python-SP-101:8').prediction.answer, 'None', 'A printing function without return returns None');
assert.equal(demo('Python-SP-101:9').prediction.answer, '[8, 3, 6]', 'sorted does not mutate its source');
assert.equal(demo('react-fundamentals:1').prediction.answer, '<p>{score}</p>', 'Braces embed the expression');
assert.equal(demo('advanced-css:1').prediction.answer, 'justify-content', 'Column makes vertical the main axis');
assert.equal(demo('masters-figma:2').prediction.answer, 'Yes, exactly');
assert.equal(3 * 288 + 2 * 24, 960 - 2 * 24, 'The authored desktop card row fits exactly');
assert.equal(demo('digital-productivity-mastery:3').prediction.answer, '29', '12+8+9 = 29');
assert.equal(demo('digital-productivity-mastery:6').prediction.answer, '20', 'Four units at five each yield revenue 20');
assert.equal(demo('masters-claude:2').prediction.answer, 'null', 'An absent deadline must follow the contract’s null rule');
assert.equal(demo('masters-codex:4').prediction.answer, 'false', 'AND requires both conditions');
assert.equal(demo('masters-prompt-engineering:4').prediction.answer, 'Factual support', 'A valid format does not justify an invented deadline');
assert.equal(demo('masters-perplexity:4').prediction.answer, 'Eight pilot participants completed', 'The claim retains the supplied population scope');
assert.throws(() => getLessonDemonstration({ id: 'new-course' }, { id: 'missing' }), /Missing authored learning demonstration/, 'Missing authored content cannot silently become generic');
console.log(`Lesson demonstrations passed: ${demonstrations.size} lessons, ${steps} causal steps, ${experiments} comparisons, ${programs} code fixtures (${jsPrograms} JS, ${pythonPrograms} Python, ${jsxPrograms} JSX, 3 CSS), 15 independent semantic checks.`);
