import type { Course, Lesson } from './data-provider';
import { getLessonLabFamily } from './lesson-labs';

export type PlayGameFamily = 'code' | 'prompt' | 'video' | 'research' | 'design' | 'creative';
export type Point = { x: number; y: number };
export type CircuitTile = { shape: 'straight' | 'corner'; rotation: number; node?: 'guard' | 'work' | 'test' };
export type PlayCard = { id: string; title: string; text: string; color?: string; valid?: boolean };
export type PlayRound = {
  id: string; title: string; goal: string; hint: string; action: string; family: PlayGameFamily;
  cards: PlayCard[]; expected: string[];
  circuit?: { tiles: CircuitTile[]; path: number[]; samples: (number | string)[]; operation: 'double' | 'sort' | 'uppercase' | 'render' };
  clipBudget?: number; claims?: PlayCard[]; evidenceLinks?: Record<string, string>;
  targets?: Record<string, Point>; initialPositions?: Record<string, Point>;
  focalTarget?: Point; focalSize?: number; requireSafeArea?: boolean;
};
export type LearningPlayGamePlan = { id: string; family: PlayGameFamily; title: string; lessonTitle: string; projectTitle: string; teaching: string; rounds: PlayRound[] };
export type PlayRoundState = { rotations: number[]; order: string[]; durations: Record<string, number>; captions: boolean; links: Record<string, string>; positions: Record<string, Point>; size: number; safeArea: boolean };
export type PlayRoundResult = { passed: boolean; progress: number; feedback: string; output: string; trace?: number[]; blockedAt?: number; values?: (number | string)[] };
export type PlayAction =
  | { type: 'rotate'; index: number }
  | { type: 'place'; id: string; index: number }
  | { type: 'remove'; id: string }
  | { type: 'cut'; id: string; delta: number }
  | { type: 'captions' }
  | { type: 'connect'; source: string; claim: string }
  | { type: 'move'; id: string; point: Point }
  | { type: 'resize'; delta: number }
  | { type: 'safe-area' };

const text = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const short = (value: string, limit = 140) => value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
const card = (id: string, title: string, value: string, valid = true): PlayCard => ({ id, title, text: value, valid });
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const N = 0, E = 1, S = 2, W = 3;
function ports(tile: CircuitTile, rotation: number) { return (tile.shape === 'straight' ? [W, E] : [N, E]).map(port => (port + rotation) % 4); }
function direction(from: number, to: number) { return to === from + 1 ? E : to === from - 1 ? W : to > from ? S : N; }
function makeCircuit(path: number[], samples: (number | string)[], operation: 'double' | 'sort' | 'uppercase' | 'render', seed: number, nodes: Record<number, CircuitTile['node']>) {
  const tiles: CircuitTile[] = Array.from({ length: 12 }, (_, index) => ({ shape: index % 3 ? 'straight' : 'corner', rotation: (seed + index) % 4 }));
  path.forEach((cell, index) => {
    const incoming = index === 0 ? W : (direction(path[index - 1], cell) + 2) % 4;
    const outgoing = index === path.length - 1 ? E : direction(cell, path[index + 1]);
    const shape = (incoming + 2) % 4 === outgoing ? 'straight' : 'corner';
    let correct = 0;
    for (let rotation = 0; rotation < 4; rotation++) if (ports({ shape, rotation: 0 }, rotation).includes(incoming) && ports({ shape, rotation: 0 }, rotation).includes(outgoing)) correct = rotation;
    tiles[cell] = { shape, rotation: (correct + 1 + (index + seed) % 2) % 4, node: nodes[cell] };
  });
  return { tiles, path, samples, operation };
}

/** Every miniature task draws its brief and teaching cue from the selected authored lesson. */
export function buildLearningPlayGame(course: Course, lesson: Lesson): LearningPlayGamePlan {
  const family = getLessonLabFamily(course, lesson);
  const objective = text(lesson.objectives?.[0] || lesson.introduction.text);
  const takeaway = text(lesson.keyTakeaways?.[0] || objective);
  const brief = text(lesson.project.description);
  const project = text(lesson.project.title);
  const introduction = text(lesson.introduction.text);
  let seed = 0; for (const letter of `${course.id}:${lesson.id}`) seed = (Math.imul(seed, 31) + letter.charCodeAt(0)) >>> 0;
  const common = (index: number, title: string, goal: string, action: string): PlayRound => ({ id: `${course.id}-${lesson.id}-${index}`, family, title, goal, action, hint: `${takeaway}\nApply it to “${project}”: ${short(brief, 250)}`, cards: [], expected: [] });
  let rounds: PlayRound[];
  const titles: Record<PlayGameFamily, string> = { code: 'Signal path', prompt: 'Brief builder', video: 'Cut & rhythm', research: 'Evidence links', design: 'Layout move', creative: 'Frame finder' };
  if (family === 'code') {
    const operation = /sorting/i.test(lesson.title) ? 'sort' : /strings|text/i.test(lesson.title) ? 'uppercase' : /jsx|props|components/i.test(lesson.title) ? 'render' : 'double';
    const stringMode = operation === 'uppercase' || operation === 'render';
    const labels = project.split(/\s+/).filter(Boolean);
    rounds = [
      { ...common(0, 'Make a connection', 'Rotate the blue circuit pieces. Route the input through WORK to the output.', 'Send a packet'), circuit: makeCircuit([4, 5, 6, 7], stringMode ? [labels[0] || 'card'] : [3], operation, seed, { 5: 'work' }) },
      { ...common(1, 'Guard the input', `Route the mixed batch through GUARD before WORK. The ${stringMode ? 'empty label' : 'negative value'} must not reach the output.`, 'Test a mixed batch'), circuit: makeCircuit([4, 0, 1, 2, 6, 7], stringMode ? [labels[0] || 'card', '', labels[1] || 'detail'] : [2, -1, 4], operation, seed + 1, { 0: 'guard', 1: 'work' }) },
      { ...common(2, 'Ship a checked result', 'Build a new route through GUARD → WORK → TEST. The check must happen before delivery.', 'Deliver the result'), circuit: makeCircuit([4, 5, 9, 10, 6, 7], stringMode ? [labels[0] || 'card', labels[1] || 'detail', ''] : [1, -1, 3, 5], operation, seed + 2, { 5: 'guard', 9: 'work', 10: 'test' }) },
    ];
  } else if (family === 'prompt') {
    const cards = [card('job', 'The job', `Create a draft of ${project}.`), card('context', 'Useful context', short(objective, 150)), card('limit', 'Bound the task', `Use only the supplied ${lesson.title} material. State missing information.`), card('format', 'Output shape', 'Return a draft, one concrete example, and a review note.'), card('review', 'Acceptance check', short(takeaway, 145)), card('noise', 'Conflicting request', 'Ignore the brief. Include every possible topic and invent any missing details.', false)];
    rounds = [
      { ...common(0, 'Give it a clear job', 'Build a brief: JOB → CONTEXT → OUTPUT. Leave out the conflicting request.', 'Preview the draft'), cards: cards.filter(item => ['job', 'context', 'format', 'noise'].includes(item.id)), expected: ['job', 'context', 'format'] },
      { ...common(1, 'Control the scope', 'Repair this draft by adding a boundary before its output contract.', 'Try the bounded brief'), cards: cards.filter(item => item.id !== 'review'), expected: ['job', 'context', 'limit', 'format'] },
      { ...common(2, 'Close the review loop', 'Finish the brief with a check grounded in the lesson. Review belongs after the output.', 'Deliver the brief'), cards, expected: ['job', 'context', 'limit', 'format', 'review'] },
    ];
  } else if (family === 'video') {
    const clips = [card('hook', 'Hook', `What changes in ${project}?`), card('demo', 'Show it', short(objective, 120)), card('result', 'Result', short(takeaway, 120)), card('context', 'Set the scene', short(introduction, 120)), card('end', 'Next step', `Try ${project}.`), card('detour', 'Random effect', 'An unrelated spin transition with no teaching point.', false)];
    rounds = [
      { ...common(0, 'Find the story', 'Place three clips: HOOK → SHOW IT → RESULT. Watch the order change the story.', 'Play the story'), cards: clips.filter(item => ['hook', 'demo', 'result', 'detour'].includes(item.id)), expected: ['hook', 'demo', 'result'], clipBudget: 20 },
      { ...common(1, 'Cut to the beat', 'Keep the same story, then cut the five-second demo down to two seconds. Fit the edit into seven seconds.', 'Play the timed cut'), cards: clips.filter(item => ['hook', 'demo', 'result', 'detour'].includes(item.id)), expected: ['hook', 'demo', 'result'], clipBudget: 7 },
      { ...common(2, 'Make the lesson travel', 'Build HOOK → SCENE → SHOW IT → RESULT → NEXT STEP. Cut each clip to two seconds and enable captions.', 'Screen the final cut'), cards: clips, expected: ['hook', 'context', 'demo', 'result', 'end'], clipBudget: 10, requireSafeArea: true },
    ];
  } else if (family === 'research') {
    rounds = [
      { ...common(0, 'Trace a claim', 'Connect the lesson claim to the authored source that supports it. An untraceable claim is not evidence.', 'Check the source trail'), claims: [card('claim-objective', 'Learning claim', short(objective, 165))], cards: [card('source-objective', 'Lesson objectives', objective), card('rumor', 'Untraceable message', 'Someone said there is no need to inspect the original material.', false), card('other', 'Different question', `The artifact is called ${project}.`)], expected: ['source-objective'], evidenceLinks: { 'claim-objective': 'source-objective' } },
      { ...common(1, 'Keep scope with the source', 'Match two claims to their original material. A source title alone does not support a different claim.', 'Verify both links'), claims: [card('claim-project', 'Project requirement', short(brief, 140)), card('claim-objective', 'Learning claim', short(objective, 140))], cards: [card('source-project', 'Authored project brief', brief), card('source-objective', 'Authored objectives', objective), card('rumor', 'Unsourced shortcut', 'Skip the project requirements; any polished result will do.', false)], expected: ['source-project', 'source-objective'], evidenceLinks: { 'claim-project': 'source-project', 'claim-objective': 'source-objective' } },
      { ...common(2, 'Deliver with evidence', 'Keep the project and teaching claims attached to the right source. Leave the unsupported claim disconnected.', 'Publish the grounded brief'), claims: [card('claim-project', 'Required artifact', short(brief, 140)), card('claim-takeaway', 'Teaching principle', short(takeaway, 140)), card('claim-rumor', 'Unsupported claim', 'This method guarantees perfect results for every task.', false)], cards: [card('source-takeaway', 'Authored takeaway', takeaway), card('source-project', 'Authored project brief', brief), card('rumor', 'No original source', 'A confident claim with no original material to inspect.', false)], expected: ['source-project', 'source-takeaway'], evidenceLinks: { 'claim-project': 'source-project', 'claim-takeaway': 'source-takeaway' } },
    ];
  } else if (family === 'design') {
    const cards = [card('heading', 'Heading', short(project, 55)), card('body', 'Supporting text', short(objective, 95)), card('action', 'Primary action', 'Try the project')];
    const targets = [{ heading: { x: 26, y: 24 }, body: { x: 27, y: 47 }, action: { x: 27, y: 73 } }, { heading: { x: 68, y: 25 }, body: { x: 68, y: 47 }, action: { x: 68, y: 73 } }, { heading: { x: 49, y: 21 }, body: { x: 49, y: 43 }, action: { x: 49, y: 76 } }];
    rounds = targets.map((target, index) => ({ ...common(index, ['Restore the hierarchy', 'Adapt the layout', 'Place the decision'][index], ['Move the headline above the supporting text, then place the action below. Snap each element into the outlined reading path.', 'The image now owns the left side. Move the three interface elements into the right-hand grid.', 'Build the centered screen. Keep the action after the explanation and inside the focus zone.'][index], ['Preview the screen', 'Try the responsive layout', 'Open the finished screen'][index]), cards, expected: ['heading', 'body', 'action'], targets: target, initialPositions: { heading: { x: 66, y: 68 }, body: { x: 25, y: 78 }, action: { x: 67, y: 28 } } }));
  } else {
    rounds = [
      { ...common(0, 'Find the focal point', 'Move the focal object onto the composition guide. Keep room for the message.', 'Capture the composition'), cards: [card('subject', 'Focal object', project)], expected: ['subject'], focalTarget: { x: 65, y: 51 }, focalSize: 26, initialPositions: { subject: { x: 20, y: 25 } } },
      { ...common(1, 'Fit a new crop', 'The square crop changes the balance. Move and resize the subject to fit the guide without covering the message.', 'Check the square crop'), cards: [card('subject', 'Focal object', project)], expected: ['subject'], focalTarget: { x: 63, y: 58 }, focalSize: 20, initialPositions: { subject: { x: 78, y: 21 } } },
      { ...common(2, 'Protect the delivery frame', 'Create the wide delivery frame: position the subject, reduce its size, and show the safe area before export.', 'Export the frame'), cards: [card('subject', 'Focal object', project)], expected: ['subject'], focalTarget: { x: 70, y: 50 }, focalSize: 22, requireSafeArea: true, initialPositions: { subject: { x: 35, y: 70 } } },
    ];
  }
  return { id: `${course.id}:${lesson.id}`, family, title: titles[family], lessonTitle: lesson.title, projectTitle: project, teaching: takeaway, rounds };
}

export function createPlayRoundState(round: PlayRound): PlayRoundState {
  return { rotations: round.circuit?.tiles.map(tile => tile.rotation) || [], order: round.family === 'prompt' && round.id.endsWith('-1') ? ['job', 'format', 'context'] : round.family === 'video' && !round.id.endsWith('-0') ? [...round.expected] : [], durations: Object.fromEntries(round.cards.map(item => [item.id, item.id === 'demo' ? 5 : 2])), captions: false, links: {}, positions: Object.fromEntries(Object.entries(round.initialPositions || {}).map(([id, point]) => [id, { ...point }])), size: round.family === 'creative' ? 37 : 26, safeArea: false };
}

export function applyPlayAction(state: PlayRoundState, action: PlayAction): PlayRoundState {
  if (action.type === 'rotate') return { ...state, rotations: state.rotations.map((rotation, index) => index === action.index ? (rotation + 1) % 4 : rotation) };
  if (action.type === 'place') {
    const order = state.order.filter(id => id !== action.id);
    order.splice(clamp(action.index, 0, order.length), 0, action.id);
    return { ...state, order };
  }
  if (action.type === 'remove') return { ...state, order: state.order.filter(id => id !== action.id) };
  if (action.type === 'cut') return { ...state, durations: { ...state.durations, [action.id]: clamp((state.durations[action.id] || 2) + action.delta, 1, 6) } };
  if (action.type === 'captions') return { ...state, captions: !state.captions };
  if (action.type === 'connect') return { ...state, links: { ...state.links, [action.claim]: state.links[action.claim] === action.source ? '' : action.source } };
  if (action.type === 'move') return { ...state, positions: { ...state.positions, [action.id]: { x: clamp(action.point.x, 8, 92), y: clamp(action.point.y, 12, 88) } } };
  if (action.type === 'resize') return { ...state, size: clamp(state.size + action.delta, 14, 42) };
  if (action.type === 'safe-area') return { ...state, safeArea: !state.safeArea };
  return state;
}

export function tracePlayCircuit(round: PlayRound, state: PlayRoundState): PlayRoundResult {
  if (!round.circuit) return { passed: false, progress: 0, feedback: 'No circuit is loaded.', output: '' };
  const circuit = round.circuit;
  const numeric = circuit.operation === 'double' || circuit.operation === 'sort';
  const accepts = (value: number | string) => numeric ? typeof value === 'number' && Number.isFinite(value) && value >= 0 : typeof value === 'string' && value.trim().length > 0;
  const transform = (input: (number | string)[]) => circuit.operation === 'sort' ? [...input].sort((a, b) => Number(a) - Number(b))
    : circuit.operation === 'uppercase' ? input.map(value => String(value).toUpperCase())
      : circuit.operation === 'render' ? input.map(value => `Card(${value})`) : input.map(value => Number(value) * 2);
  const expected = transform(circuit.samples.filter(accepts));
  const validOutput = (output: (number | string)[]) => output.length === expected.length
    && output.every((value, index) => numeric ? typeof value === 'number' && Number.isFinite(value) && value >= 0 && value === expected[index]
      : typeof value === 'string' && value.length > 0 && value === expected[index]);
  let cell = 4, incoming = W;
  let values = [...circuit.samples];
  let tested = false, testPassed = true;
  const trace: number[] = [];
  const nodes: string[] = [];
  for (let step = 0; step < 24; step++) {
    if (trace.includes(cell)) return { passed: false, progress: trace.length / circuit.path.length, feedback: 'The packet is stuck in a loop. Rotate a corner to give it an exit.', output: values.join(', '), trace, blockedAt: cell, values };
    trace.push(cell);
    const tile = circuit.tiles[cell];
    const connections = ports(tile, state.rotations[cell]);
    if (!connections.includes(incoming)) return { passed: false, progress: clamp((trace.length - 1) / circuit.path.length, 0, 1), feedback: 'The signal meets a closed side. Rotate this piece until its opening meets the incoming path.', output: values.join(', '), trace, blockedAt: cell, values };
    if (tile.node) {
      nodes.push(tile.node);
      if (tile.node === 'guard') values = values.filter(accepts);
      if (tile.node === 'work') values = transform(values);
      if (tile.node === 'test') { tested = true; testPassed = validOutput(values); }
    }
    const outgoing = connections.find(port => port !== incoming)!;
    if (cell === 7 && outgoing === E) {
      const required = circuit.path.map(index => circuit.tiles[index].node).filter(Boolean);
      const goodOrder = required.every((node, index) => nodes[index] === node);
      const passed = goodOrder && nodes.length === required.length && validOutput(values) && (!tested || testPassed);
      return { passed, progress: passed ? 1 : 0.7, feedback: passed ? 'Delivered. The sample follows the required operations in the right order and its actual values pass the output check.' : !validOutput(values) || tested && !testPassed ? 'The output check failed: delivery needs valid values and the expected transformation. Inspect the guard and work steps.' : 'The packet arrived, but bypassed an operation. Delivery needs the full processing route.', output: values.join(', '), trace, values };
    }
    const row = Math.floor(cell / 4), column = cell % 4;
    if ((outgoing === N && row === 0) || (outgoing === S && row === 2) || (outgoing === W && column === 0) || (outgoing === E && column === 3)) return { passed: false, progress: clamp(trace.length / circuit.path.length, 0, 1), feedback: 'The signal spills outside the circuit. Turn the last piece toward the output.', output: values.join(', '), trace, blockedAt: cell, values };
    cell += outgoing === N ? -4 : outgoing === S ? 4 : outgoing === E ? 1 : -1;
    incoming = (outgoing + 2) % 4;
  }
  return { passed: false, progress: 0, feedback: 'The route needs a shorter path to its output.', output: '', trace };
}

export function evaluatePlayRound(round: PlayRound, state: PlayRoundState): PlayRoundResult {
  if (round.family === 'code') return tracePlayCircuit(round, state);
  if (round.family === 'prompt' || round.family === 'video') {
    const correct = round.expected.filter((id, index) => state.order[index] === id).length;
    const same = correct === round.expected.length && state.order.length === round.expected.length;
    const conflicting = state.order.some(id => round.cards.find(item => item.id === id)?.valid === false);
    const duration = state.order.reduce((total, id) => total + (state.durations[id] || 2), 0);
    const timing = round.family !== 'video' || duration <= (round.clipBudget || 20) && (!round.id.endsWith('-1') || state.durations.demo === 2) && (!round.id.endsWith('-2') || state.order.every(id => state.durations[id] === 2));
    const captions = !round.requireSafeArea || state.captions;
    const passed = same && !conflicting && timing && captions;
    return { passed, progress: clamp(correct / round.expected.length * (timing && captions ? 1 : 0.8), 0, 1), feedback: conflicting ? 'The unrelated block changes the job. Remove it and inspect the draft again.' : !same ? round.family === 'video' ? 'The cut loses its teaching sequence. Put the demonstration before its result.' : 'The brief is missing a part or its reading order is unclear. Try the job first and review last.' : !timing ? `This cut is ${duration}s. Use the clip handles to fit the ${round.clipBudget}s beat and keep each required shot at two seconds.` : !captions ? 'The visual story works. Turn on captions so its teaching point survives with the sound off.' : round.family === 'video' ? 'The edit has a clear teaching sequence, readable timing, and a useful ending.' : 'The brief has a concrete job, supplied context, and a usable output contract.', output: round.family === 'video' ? `${duration}s · ${state.order.map(id => round.cards.find(item => item.id === id)?.title).join(' → ')}${state.captions ? ' · captions on' : ''}` : state.order.map(id => round.cards.find(item => item.id === id)?.text).join('\n') };
  }
  if (round.family === 'research') {
    const pairs = Object.entries(round.evidenceLinks || {});
    const correct = pairs.filter(([claim, source]) => state.links[claim] === source).length;
    const unsupported = Object.entries(state.links).some(([claim, source]) => source && round.evidenceLinks?.[claim] !== source);
    return { passed: correct === pairs.length && !unsupported, progress: correct / pairs.length, feedback: unsupported ? 'That connection does not support the claim. Disconnect it; a confident title or an unsourced statement is not a source trail.' : correct < pairs.length ? 'The brief still has an unsupported teaching or project claim. Trace it to the original authored material.' : 'Every published claim keeps its original evidence. The unsupported claim stays outside the brief.', output: `${correct}/${pairs.length} traceable claims${unsupported ? ' · unsupported connection' : ''}` };
  }
  if (round.family === 'design') {
    const pairs = Object.entries(round.targets || {});
    const correct = pairs.filter(([id, target]) => Math.hypot((state.positions[id]?.x || 0) - target.x, (state.positions[id]?.y || 0) - target.y) <= 6).length;
    return { passed: correct === pairs.length, progress: correct / pairs.length, feedback: correct === pairs.length ? 'The screen now has a readable hierarchy and one clear decision. The elements share the intended grid.' : 'An element sits outside the reading path. Drag it toward its outlined grid position, or use the arrow controls.', output: `${correct}/${pairs.length} elements aligned · heading → explanation → action` };
  }
  const target = round.focalTarget!;
  const point = state.positions.subject;
  const aligned = !!point && Math.hypot(point.x - target.x, point.y - target.y) <= 6;
  const sized = Math.abs(state.size - (round.focalSize || 26)) <= 2;
  const safe = !round.requireSafeArea || state.safeArea;
  return { passed: aligned && sized && safe, progress: [aligned, sized, safe].filter(Boolean).length / 3, feedback: !aligned ? 'The focal point competes with the message. Move it onto the composition guide.' : !sized ? 'The subject does not fit the crop. Resize it toward the dotted silhouette so the message has room.' : !safe ? 'The composition fits. Show the safe area and check its crop-sensitive edges before export.' : 'The focal subject, message space, and delivery crop work together.', output: `${Math.round(point?.x || 0)}, ${Math.round(point?.y || 0)} · subject ${state.size}% · safe area ${state.safeArea ? 'visible' : 'off'}` };
}

/** A reference solution for coverage tests; the UI never grants credit from this helper. */
export function solvePlayRound(round: PlayRound): PlayRoundState {
  const state = createPlayRoundState(round);
  if (round.circuit) round.circuit.path.forEach((cell, index, path) => {
    const incoming = index === 0 ? W : (direction(path[index - 1], cell) + 2) % 4;
    const outgoing = index === path.length - 1 ? E : direction(cell, path[index + 1]);
    for (let rotation = 0; rotation < 4; rotation++) if (ports(round.circuit!.tiles[cell], rotation).includes(incoming) && ports(round.circuit!.tiles[cell], rotation).includes(outgoing)) state.rotations[cell] = rotation;
  });
  state.order = [...round.expected]; state.links = { ...round.evidenceLinks };
  if (round.targets) state.positions = Object.fromEntries(Object.entries(round.targets).map(([id, point]) => [id, { ...point }]));
  if (round.focalTarget) state.positions.subject = { ...round.focalTarget };
  state.size = round.focalSize || 26; state.safeArea = true; state.captions = true;
  Object.keys(state.durations).forEach(id => { state.durations[id] = 2; });
  return state;
}
