// Check shipped curriculum coverage, real player actions and independent domain
// fixtures. A reference solution alone cannot demonstrate a useful simulation.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { buildLearningGamePlan, createGameState, applyGameAction, evaluateGame, solveGame, gameContrastRatio, gameKindLabels } = require('../src/lib/learning-game-catalog.ts');
const root = path.resolve(__dirname, '..');
const courses = fs.readdirSync(path.join(root, 'src/data/courses')).filter(name => name.endsWith('.json')).map(name => JSON.parse(fs.readFileSync(path.join(root, 'src/data/courses', name), 'utf8')));
const plans = [], ids = new Set(), kinds = new Set();
let actions = 0, negatives = 0, fixtures = 0;
function act(challenge, state, action) {
  const before = JSON.stringify(state);
  const next = applyGameAction(challenge, state, action);
  assert.notEqual(next, state);
  assert.equal(JSON.stringify(state), before, 'Actions preserve the previous state');
  actions++;
  return next;
}
function evaluation(challenge, state) {
  const before = JSON.stringify({ challenge, state });
  const result = evaluateGame(challenge, state);
  assert.equal(JSON.stringify({ challenge, state }), before, 'Evaluation never modifies lesson or player state');
  assert(Number.isFinite(result.progress) && result.progress >= 0 && result.progress <= 1);
  assert(result.checks.length >= 2 && result.feedback.length > 20 && result.output.length > 0);
  return result;
}
function reject(challenge, state, message) { assert.equal(evaluation(challenge, state).passed, false, message); negatives++; }
function playToState(challenge, desired) {
  let state = createGameState(challenge);
  Object.entries(desired.choices).forEach(([key, value]) => { state = act(challenge, state, { type: 'choice', key, value }); });
  Object.entries(desired.numbers).forEach(([key, value]) => { state = act(challenge, state, { type: 'number', key, value }); });
  Object.entries(desired.groups).forEach(([id, group]) => { state = act(challenge, state, { type: 'group', id, group }); });
  state.order.filter(id => !desired.order.includes(id)).forEach(id => { state = act(challenge, state, { type: 'order', id, index: -1 }); });
  desired.order.forEach((id, index) => { state = act(challenge, state, { type: 'order', id, index }); });
  [...state.selected].filter(id => !desired.selected.includes(id)).forEach(id => { state = act(challenge, state, { type: 'toggle', id }); });
  desired.selected.filter(id => !state.selected.includes(id)).forEach(id => { state = act(challenge, state, { type: 'toggle', id }); });
  return state;
}
for (const course of courses) {
  const courseKinds = new Set(); let previous = '';
  for (const lesson of course.lessons) {
    const plan = buildLearningGamePlan(course, lesson);
    plans.push(plan);
    assert.equal(plan.lessonTitle, lesson.title);
    assert.equal(plan.projectTitle, lesson.project.title);
    assert.equal(plan.challenges.length, 3);
    assert.equal(new Set(plan.challenges.map(challenge => challenge.kind)).size, 3, 'Three distinct mechanics in every lesson');
    const signature = plan.challenges.map(challenge => challenge.kind).join(',');
    assert.notEqual(signature, previous, `${course.id}: adjacent lessons should change mechanics`); previous = signature;
    for (const challenge of plan.challenges) {
      assert(!ids.has(challenge.id), 'Game IDs uniquely identify a lesson and mechanic'); ids.add(challenge.id);
      assert(challenge.brief.includes(plan.projectTitle), 'The scenario names the actual authored project');
      assert(challenge.instruction.length > 40 && challenge.connection.length > 70 && challenge.hint.length > 20, `${challenge.id}: meaningful task, connection and hint`);
      assert(challenge.items.length > 0 && challenge.items.every(entry => entry.label && entry.id));
      kinds.add(challenge.kind); courseKinds.add(challenge.kind);
      reject(challenge, createGameState(challenge), `${challenge.id}: untouched work cannot complete a game`);
      const solution = solveGame(challenge);
      const actual = playToState(challenge, solution);
      assert.deepEqual(actual, solution, 'Every reference state is reachable with actual supported actions');
      assert(evaluation(challenge, actual).passed, `${challenge.id} can be solved through play`);
      const bad = structuredClone(actual);
      switch (challenge.kind) {
        case 'code': bad.choices.operation = 'unknown'; break;
        case 'branch': if (challenge.settings.mode === 'checks') bad.choices.rule = '||'; else bad.numbers.threshold = 1000; break;
        case 'loop': bad.numbers.repeats = 99; break;
        case 'sort': [bad.order[0], bad.order[1]] = [bad.order[1], bad.order[0]]; break;
        case 'lookup': bad.choices.key = 'missing'; break;
        case 'grid': bad.numbers.gap = 90; break;
        case 'layout': bad.numbers.heading = bad.numbers.body; break;
        case 'contrast': bad.choices.ink = bad.choices.background; break;
        case 'timeline': bad.order.reverse(); break;
        case 'mix': bad.numbers.music = 99; break;
        case 'caption': bad.numbers.end = 3; break;
        case 'camera': bad.numbers.x = 95; break;
        case 'evidence': bad.groups.rumor = 'keep'; break;
        case 'claim': bad.choices['claim-a'] = 'source-noise'; break;
        case 'query': bad.choices.scope = 'broad'; break;
        case 'budget': bad.selected.push('risk'); break;
        case 'sequence': bad.order.reverse(); break;
        case 'chart': bad.numbers['cell-0'] += 1; break;
      }
      reject(challenge, bad, `${challenge.id}: harmful changes fail for a substantive reason`);
      const initial = createGameState(challenge);
      assert.deepEqual(act(challenge, initial, { type: 'number', key: 'bad', value: NaN }), initial, 'Non-finite numeric actions are ignored');
      assert.deepEqual(act(challenge, initial, { type: 'toggle', id: 'missing' }), initial, 'Missing item cannot be packed');
    }
  }
  if (course.lessons.length > 1) assert(courseKinds.size >= 4, `${course.id}: multi-lesson course needs diverse learning surfaces`);
}
assert.equal(plans.length, 84, 'All 84 authored lessons are playable');
assert.equal(ids.size, 252);
assert.deepEqual([...kinds].sort(), Object.keys(gameKindLabels).sort(), 'Every advertised mechanic is genuinely used');

const game = (courseId, lessonId, kind) => plans.find(plan => plan.id === `learning-games:${courseId}:${lessonId}`).challenges.find(challenge => challenge.kind === kind);
const pass = (challenge, state, expectedOutput) => { const result = evaluation(challenge, state); assert(result.passed); if (expectedOutput) assert(result.output.includes(expectedOutput)); fixtures++; return result; };
// Independently known Python arithmetic and control flow.
const calculator = game('Python-SP-101', '1', 'code');
pass(calculator, { ...createGameState(calculator), choices: { operation: 'add-one' }, numbers: { input: 6 } }, '→ 7');
reject(calculator, { ...createGameState(calculator), choices: { operation: 'double' }, numbers: { input: 3.5 } }, 'A coincidental output from a different expression is not the requested function');
const age = game('Python-SP-101', '2', 'branch');
pass(age, { ...createGameState(age), choices: { rule: '>=' }, numbers: { threshold: 18 } }, 'Accepted: 18, 24');
reject(age, { ...createGameState(age), choices: { rule: '>' }, numbers: { threshold: 18 } }, 'Boundary age 18 must be included');
pass(age, { ...createGameState(age), choices: { rule: '>' }, numbers: { threshold: 17 } }, 'Accepted: 18, 24');
const reviewGate = game('masters-codex', '1', 'branch');
pass(reviewGate, { ...createGameState(reviewGate), choices: { rule: '&&' } }, 'Released: Reviewed and tested · held: 3');
reject(reviewGate, { ...createGameState(reviewGate), choices: { rule: '||' } }, 'OR releases a change with one missing safety check');
const rover = game('Python-SP-101', '3', 'loop');
pass(rover, { ...createGameState(rover), choices: { mode: 'sum' }, numbers: { repeats: 4 } }, 'sum: 10');
reject(rover, { ...createGameState(rover), choices: { mode: 'sum' }, numbers: { repeats: 5 } }, 'The fifth input changes 10 to 15');
const text = game('Python-SP-101', '4', 'lookup');
pass(text, { ...createGameState(text), choices: { key: 'message', transform: 'length' } }, '"Learning" → 8');
const dict = game('Python-SP-101', '6', 'lookup');
pass(dict, { ...createGameState(dict), choices: { key: 'city', transform: 'identity' } }, '"Tokyo"');
const tuple = game('Python-SP-101', '7', 'lookup');
pass(tuple, { ...createGameState(tuple), choices: { key: '2', transform: 'identity' } }, '"south"');
const conveyor = game('Python-SP-101', '9', 'sort');
let sorted = act(conveyor, createGameState(conveyor), { type: 'choice', key: 'direction', value: 'ascending' });
// Sort by neighboring comparisons, using the same operation offered by the UI.
for (let passIndex = 0; passIndex < conveyor.items.length; passIndex++) {
  for (let index = 0; index < sorted.order.length - 1; index++) {
    const left = conveyor.items.find(entry => entry.id === sorted.order[index]).value;
    const right = conveyor.items.find(entry => entry.id === sorted.order[index + 1]).value;
    if (left > right) sorted = act(conveyor, sorted, { type: 'swap', index });
  }
}
pass(conveyor, sorted, '1 → 3 → 6 → 8');
assert.deepEqual(act(conveyor, sorted, { type: 'swap', index: -1 }), sorted, 'An out-of-bounds swap leaves the collection intact');

// Layout, actual luminance and data fidelity use quantities, not a magic answer.
assert(Math.abs(gameContrastRatio('#000000', '#ffffff') - 21) < 1e-12);
assert.equal(gameContrastRatio('#ffffff', '#ffffff'), 1);
assert(Math.abs(gameContrastRatio('#20242b', '#ffffff') - gameContrastRatio('#ffffff', '#20242b')) < 1e-12);
fixtures += 3;
const flex = game('advanced-css', '1', 'grid');
pass(flex, { ...createGameState(flex), choices: { direction: 'row', align: 'space-between' }, numbers: { gap: 24 } }, '308/360');
reject(flex, { ...createGameState(flex), choices: { direction: 'row', align: 'space-between' }, numbers: { gap: 60 } }, 'Large gaps overflow the nav container');
const sheet = game('digital-productivity-mastery', '3', 'chart');
pass(sheet, { ...createGameState(sheet), choices: { type: 'bar', aggregate: 'sum' }, numbers: { 'cell-0': 12, 'cell-1': 24, 'cell-2': 18, 'cell-3': 30 } }, 'sum: 84');
reject(sheet, { ...createGameState(sheet), choices: { type: 'bar', aggregate: 'sum' }, numbers: { 'cell-0': 12, 'cell-1': 42, 'cell-2': 18, 'cell-3': 30 } }, 'An attractive chart cannot hide a mistyped data cell');
const average = game('digital-productivity-mastery', '6', 'chart');
pass(average, { ...createGameState(average), choices: { type: 'bar', aggregate: 'average' }, numbers: { 'cell-0': 12, 'cell-1': 24, 'cell-2': 18, 'cell-3': 30 } }, 'average: 21');

// Editing and planning admit several valid choices while enforcing the brief.
const edit = game('masters-capcut', '1', 'timeline');
pass(edit, { ...createGameState(edit), order: ['hook', 'demo', 'proof', 'close'], numbers: { hook: 2, demo: 4, proof: 3, close: 2 } }, '11.0 seconds');
pass(edit, { ...createGameState(edit), order: ['hook', 'demo', 'proof', 'close'], numbers: { hook: 3, demo: 3, proof: 2, close: 2 } }, '10.0 seconds');
const mix = game('masters-capcut', '4', 'mix');
pass(mix, { ...createGameState(mix), numbers: { voice: 80, music: 15, effects: 10 } }, 'combined 105%');
reject(mix, { ...createGameState(mix), numbers: { voice: 85, music: 25, effects: 15 } }, 'Individually acceptable tracks can still exceed combined headroom');
const caption = game('masters-capcut', '3', 'caption');
pass(caption, { ...createGameState(caption), choices: { wrap: 'phrases' }, numbers: { start: 1.5, end: 6.5, font: 32 } }, '1.5–6.5s');
reject(caption, { ...createGameState(caption), choices: { wrap: 'single' }, numbers: { start: 2, end: 6, font: 32 } }, 'Timing alone cannot repair an overlong line');
const strategy = game('masters-higgsfield', '5', 'budget');
pass(strategy, { ...createGameState(strategy), selected: ['core', 'check'] }, '7/10');
pass(strategy, { ...createGameState(strategy), selected: ['core', 'check', 'detail'] }, '9/10');
pass(strategy, { ...createGameState(strategy), selected: ['core', 'check', 'polish'] }, '10/10');
const source = game('masters-perplexity', '3', 'evidence');
reject(source, { ...createGameState(source), groups: { primary: 'keep', independent: 'reject', rumor: 'keep', old: 'reject' } }, 'A repost cannot substitute for an independent check');
const chain = game('Python-SP-101', '8', 'sequence');
reject(chain, { ...createGameState(chain), order: ['purpose', 'inspect', 'build', 'deliver', 'check'] }, 'A returned value must exist before the caller uses it');
console.log(`Distinct learning games passed: ${plans.length} lessons, ${ids.size} playable challenges, ${kinds.size} mechanics, ${actions} player actions, ${negatives} rejected cases, ${fixtures} independent fixtures.`);
