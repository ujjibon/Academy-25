import type { Course, Lesson } from './data-provider';
import { getLessonLabFamily } from './lesson-labs';

/** Each kind has a different operation, state space, and visible consequence. */
export type GameKind = 'code' | 'branch' | 'loop' | 'sort' | 'lookup' | 'grid' | 'layout' | 'contrast' | 'timeline' | 'mix' | 'caption' | 'camera' | 'evidence' | 'claim' | 'query' | 'budget' | 'sequence' | 'chart';
export type GameItem = { id: string; label: string; detail?: string; value?: number; category?: string; cost?: number; color?: string };
export type GameState = { choices: Record<string, string>; numbers: Record<string, number>; order: string[]; groups: Record<string, string>; selected: string[] };
export type GameAction =
  | { type: 'choice'; key: string; value: string }
  | { type: 'number'; key: string; value: number }
  | { type: 'toggle'; id: string }
  | { type: 'order'; id: string; index: number }
  | { type: 'group'; id: string; group: string }
  | { type: 'swap'; index: number };
export type GameChallenge = {
  id: string; kind: GameKind; title: string; brief: string; instruction: string;
  connection: string; hint: string; action: string; items: GameItem[];
  settings: Record<string, string | number | string[] | number[]>; initial: GameState;
};
export type GameEvaluation = { passed: boolean; progress: number; feedback: string; output: string; checks: { label: string; passed: boolean }[] };
export type LearningGamePlan = {
  id: string; title: string; lessonTitle: string; projectTitle: string; teaching: string;
  family: 'code' | 'prompt' | 'video' | 'research' | 'design' | 'creative'; challenges: GameChallenge[];
};

export const gameKindLabels: Record<GameKind, string> = {
  code: 'Expression machine', branch: 'Decision gate', loop: 'Loop rover', sort: 'Sorting conveyor',
  lookup: 'Key explorer', grid: 'Constraint canvas', layout: 'Hierarchy studio', contrast: 'Contrast lab',
  timeline: 'Timeline editor', mix: 'Sound desk', caption: 'Caption director', camera: 'Camera stage',
  evidence: 'Source detective', claim: 'Claim checker', query: 'Search lens', budget: 'Resource strategy',
  sequence: 'Process dominoes', chart: 'Data story',
};

const clean = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const short = (value: string, length = 155) => value.length > length ? `${value.slice(0, length - 1)}…` : value;
const blank = (): GameState => ({ choices: {}, numbers: {}, order: [], groups: {}, selected: [] });
const item = (id: string, label: string, detail?: string, extra: Partial<GameItem> = {}): GameItem => ({ id, label, detail, ...extra });
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const operationLabel = (operation: string) => ({ 'add-one': 'add-one', double: 'double', square: 'square', sum: 'running-sum' }[operation] || operation);
const number = (challenge: GameChallenge, key: string, fallback = 0) => typeof challenge.settings[key] === 'number' ? challenge.settings[key] as number : fallback;
const string = (challenge: GameChallenge, key: string, fallback = '') => typeof challenge.settings[key] === 'string' ? challenge.settings[key] as string : fallback;
const strings = (challenge: GameChallenge, key: string) => Array.isArray(challenge.settings[key]) ? challenge.settings[key] as string[] : [];

// These are deliberate curriculum mappings, not a hash choosing an unrelated game.
// The same lesson always returns the same material, so resuming preserves the task.
const curriculum: Record<string, GameKind[][]> = {
  'Python-SP-101': [
    ['code', 'lookup', 'branch'], ['branch', 'lookup', 'sequence'], ['loop', 'branch', 'code'],
    ['lookup', 'sequence', 'branch'], ['sort', 'lookup', 'loop'], ['lookup', 'branch', 'sequence'],
    ['lookup', 'sort', 'sequence'], ['code', 'loop', 'sequence'], ['sort', 'loop', 'code'],
  ],
  'react-fundamentals': [['code', 'layout', 'sequence'], ['lookup', 'branch', 'code']],
  'advanced-css': [['grid', 'layout', 'contrast']],
  'masters-codex': [
    ['sequence', 'branch', 'budget'], ['query', 'budget', 'code'], ['lookup', 'evidence', 'sequence'],
    ['code', 'sort', 'sequence'], ['branch', 'loop', 'code'], ['branch', 'lookup', 'loop'], ['sequence', 'budget', 'claim'],
  ],
  'masters-antigravity': [
    ['sequence', 'lookup', 'budget'], ['query', 'claim', 'sequence'], ['budget', 'evidence', 'lookup'],
    ['sequence', 'branch', 'budget'], ['claim', 'branch', 'evidence'], ['lookup', 'sequence', 'query'],
  ],
  'masters-claude': [
    ['query', 'budget', 'sequence'], ['query', 'claim', 'sequence'], ['evidence', 'claim', 'budget'],
    ['sequence', 'layout', 'query'], ['chart', 'claim', 'evidence'], ['lookup', 'budget', 'sequence'],
  ],
  'masters-perplexity': [
    ['query', 'evidence', 'claim'], ['query', 'budget', 'evidence'], ['evidence', 'claim', 'query'],
    ['claim', 'evidence', 'chart'], ['sequence', 'claim', 'layout'], ['budget', 'sequence', 'lookup'],
  ],
  'masters-prompt-engineering': [
    ['query', 'budget', 'sequence'], ['sequence', 'claim', 'query'], ['query', 'lookup', 'budget'],
    ['branch', 'claim', 'evidence'], ['claim', 'branch', 'sequence'], ['lookup', 'budget', 'evidence'],
    ['sequence', 'query', 'budget'],
  ],
  'masters-figma': [
    ['grid', 'layout', 'contrast'], ['grid', 'layout', 'budget'], ['contrast', 'layout', 'claim'],
    ['lookup', 'grid', 'sequence'], ['sequence', 'camera', 'branch'], ['grid', 'budget', 'claim'],
  ],
  'masters-canva': [
    ['contrast', 'layout', 'budget'], ['contrast', 'lookup', 'sequence'], ['layout', 'grid', 'contrast'],
    ['grid', 'camera', 'budget'], ['sequence', 'layout', 'chart'], ['budget', 'claim', 'contrast'],
  ],
  'masters-capcut': [
    ['timeline', 'mix', 'caption'], ['timeline', 'camera', 'mix'], ['caption', 'layout', 'mix'],
    ['mix', 'caption', 'budget'], ['timeline', 'camera', 'budget'], ['budget', 'caption', 'sequence'],
  ],
  'masters-higgsfield': [
    ['camera', 'query', 'budget'], ['query', 'camera', 'sequence'], ['camera', 'claim', 'query'],
    ['camera', 'contrast', 'timeline'], ['budget', 'camera', 'evidence'], ['timeline', 'caption', 'mix'],
  ],
  'masters-creative-ai-capstone': [
    ['budget', 'sequence', 'claim'], ['evidence', 'claim', 'query'], ['query', 'layout', 'sequence'],
    ['layout', 'contrast', 'grid'], ['timeline', 'camera', 'mix'], ['claim', 'budget', 'sequence'],
  ],
  'digital-productivity-mastery': [
    ['sequence', 'budget', 'query'], ['sequence', 'claim', 'lookup'], ['chart', 'lookup', 'sort'],
    ['layout', 'chart', 'sequence'], ['layout', 'contrast', 'sequence'], ['chart', 'sort', 'lookup'],
    ['chart', 'layout', 'contrast'], ['sequence', 'budget', 'branch'], ['contrast', 'layout', 'grid'],
    ['budget', 'sequence', 'chart'],
  ],
};

type Context = { course: Course; lesson: Lesson; index: number; title: string; project: string; objective: string; subject: string };

function createChallenge(context: Context, kind: GameKind, round: number): GameChallenge {
  const { course, lesson, index, project, objective } = context;
  const python = course.id === 'Python-SP-101';
  const react = course.id === 'react-fundamentals';
  const productivity = course.id === 'digital-productivity-mastery';
  const design = /figma|canva|css/.test(course.id);
  const research = /perplexity|claude/.test(course.id) || /Research/.test(lesson.title);
  const prompt = /prompt|Brief|Context/.test(`${course.id} ${lesson.title}`);
  const subject = context.subject;
  const challenge: GameChallenge = {
    id: `${course.id}:${lesson.id}:${kind}:${round}`, kind, title: gameKindLabels[kind],
    brief: `${subject} · ${project}`, instruction: '', connection: '', hint: '', action: 'Try it', items: [], settings: {}, initial: blank(),
  };
  const s = challenge.settings;
  const n = challenge.initial.numbers;
  const c = challenge.initial.choices;
  const goal = short(objective);

  if (kind === 'code') {
    const operation = python && index === 0 ? 'add-one' : /Refactor|Components|Reusable/.test(lesson.title) ? 'double' : /Sorting|Tests|Loops/.test(lesson.title) ? 'sum' : 'square';
    const input = operation === 'square' ? 4 : operation === 'sum' ? 4 : 6;
    const target = calculate(operation, input);
    Object.assign(s, { operations: ['add-one', 'double', 'square', 'sum'], inputMin: 1, inputMax: 12, target, source: react ? 'return <Counter value={expression} />;' : 'result = expression(input)', language: react ? 'jsx' : python ? 'python' : 'javascript', operation });
    Object.assign(n, { input: 2 }); Object.assign(c, { operation: 'add-one' });
    challenge.items = [item('add-one', '+ 1', 'input + 1'), item('double', '× 2', 'input * 2'), item('square', 'Square', 'input ** 2'), item('sum', 'Running sum', 'sum(range(1, input + 1))')];
    challenge.title = react ? 'Render the prop' : python && index === 0 ? 'Calculator machine' : /Refactor/.test(lesson.title) ? 'Refactor without drift' : /Tests/.test(lesson.title) ? 'Fixture machine' : 'Function bench';
    challenge.instruction = `Choose the ${operationLabel(operation)} expression and an input that produces ${target}. ${react ? 'The rendered value follows your prop.' : 'The preview evaluates the expression you choose.'}`;
    challenge.connection = react ? 'JSX embeds JavaScript expressions. A prop changes what a component renders.' : `Changing an operator changes the program's behavior. Test the function on a known input before using it in ${project}.`;
    challenge.hint = `${operationLabel(operation)} means ${operation === 'sum' ? 'add every integer from 1 through input' : operation === 'square' ? 'multiply input by itself' : operation === 'double' ? 'multiply input by 2' : 'add 1 to input'}. Target: ${target}.`;
    challenge.action = react ? 'Render' : 'Run expression';
  } else if (kind === 'branch') {
    const age = python && index === 1;
    const textLength = python && index === 3;
    const attempts = python && index === 2;
    const risk = /codex|antigravity/.test(course.id) && !/Tests|Debug/.test(lesson.title);
    const prototype = design;
    const sampleValues = age ? [12, 17, 18, 24] : textLength ? [0, 2, 3, 8] : attempts ? [1, 2, 3, 4] : risk ? [0, 1, 3, 5] : prototype ? [0, 2, 3, 4] : /Tests|Debug/.test(lesson.title) ? [-1, 0, 1, 4] : python ? [0, 1, 2, 4] : [55, 79, 80, 95];
    const threshold = age ? 18 : textLength || prototype || risk ? 3 : attempts ? 4 : python || /Tests|Debug/.test(lesson.title) ? 1 : 80;
    const expectedRule = risk || attempts ? '<' : '>=';
    const expectedPass = (value: number) => expectedRule === '<' ? value < threshold : value >= threshold;
    Object.assign(s, { expectedRoutes: sampleValues.map(value => expectedPass(value) ? 'accept' : 'reject'), thresholdMin: -2, thresholdMax: 100, threshold, expectedRule });
    const sampleLabel = age ? 'Age' : textLength ? 'Text length' : attempts ? 'Attempt' : risk ? 'Unresolved risks' : prototype ? 'Completed fields' : python && index === 0 ? 'Divisor' : python || /Tests|Debug/.test(lesson.title) ? 'Input' : 'Rubric score';
    challenge.items = sampleValues.map((value, i) => item(`sample-${i}`, `${sampleLabel} ${value}`, expectedPass(value) ? age ? 'Must enter the adult lane.' : 'Must pass the check.' : age ? 'Must stay outside the adult lane.' : 'Must be rejected.', { value }));
    Object.assign(c, { rule: '>' }); Object.assign(n, { threshold: age ? 12 : 80 });
    challenge.title = age ? 'Age gate' : textLength ? 'Text validation gate' : attempts ? 'Guessing-game stop gate' : risk ? 'Risk clearance gate' : /Tests|Debug/.test(lesson.title) ? 'Boundary test gate' : design ? 'Prototype decision' : prompt ? 'Rubric gate' : 'Review gate';
    challenge.instruction = `${risk ? 'This release policy permits fewer than three unresolved risks. ' : attempts ? 'Allow at most three guesses; stop on the fourth attempt. ' : prototype ? 'Continue only after all three required form fields are complete. ' : python && index === 0 ? 'The calculator must reject a zero divisor. ' : ''}Build a condition that accepts ${sampleValues.filter(expectedPass).join(', ')} and rejects ${sampleValues.filter(value => !expectedPass(value)).join(', ')}. Test the boundary, not only the easy cases.`;
    challenge.connection = age ? 'An if condition sends values into different branches. “At least 18” includes the boundary value 18.' : textLength ? 'Validate text by measuring its length first. An empty or two-character string must fail a minimum-three-character requirement.' : attempts ? 'A guessing loop needs a stopping condition. A fourth attempt must take the exit path instead of extending the loop indefinitely.' : risk ? 'A delivery policy translates review findings into an explicit decision. The rule must hold risky work for review instead of rewarding a larger risk count.' : prototype ? 'A prototype transition can depend on form state. Incomplete input must remain on the current screen; a completed form can continue.' : python && index === 0 ? 'Check a divisor before performing division. Guarding zero prevents a runtime error at the calculator’s input boundary.' : `${goal} A decision rule is useful only if both successful and failing cases take the right route.`;
    challenge.hint = expectedRule === '<' ? `Use < ${threshold}. This sends ${sampleValues.filter(expectedPass).join(', ')} through and stops ${sampleValues.filter(value => !expectedPass(value)).join(', ')}.` : `Use ≥ and include the smallest passing value (${threshold}). Several thresholds can be valid if every sample takes the intended lane.`;
    challenge.action = 'Run cases';
    if (risk && /Mindset|Review/.test(lesson.title)) {
      Object.assign(s, { mode: 'checks', reviewFlags: [1, 1, 0, 0], testFlags: [1, 0, 1, 0], expectedRoutes: ['accept', 'reject', 'reject', 'reject'], expectedRule: '&&' });
      c.rule = '||';
      challenge.items = [
        item('checked-both', 'Reviewed and tested', 'The diff was inspected and the tests passed.'),
        item('review-only', 'Review without tests', 'The diff was inspected, but no passing test result exists.'),
        item('test-only', 'Tests without review', 'Tests passed, but the change and its scope were not inspected.'),
        item('neither', 'Unchecked change', 'Neither diff review nor passing tests are recorded.'),
      ];
      challenge.title = 'Release safety gate';
      challenge.instruction = 'Release a change only when its diff was reviewed AND its tests passed. Choose the logical gate that admits a fully checked change and holds every incomplete review case.';
      challenge.connection = 'Diff review checks scope and intent; tests check exercised behavior. These are complementary checks, so a release condition needs both rather than either one.';
      challenge.hint = 'Use AND (&&). OR (||) would release a change that was reviewed without tests, or tested without review.';
    }
  } else if (kind === 'loop') {
    const values = /Sorting/.test(lesson.title) ? [1, 2, 3, 4, 5] : [2, 4, 1, 3, 5];
    const repeats = /Loops/.test(lesson.title) ? 4 : /Lists/.test(lesson.title) ? 5 : 3;
    const mode = /Tests|Debug/.test(lesson.title) ? 'count' : 'sum';
    const target = mode === 'count' ? repeats : values.slice(0, repeats).reduce((a, b) => a + b, 0);
    Object.assign(s, { maxRepeats: values.length, target, mode, repeats });
    challenge.items = values.map((value, i) => item(`step-${i}`, `Step ${i + 1}`, `Visit value ${value}.`, { value }));
    Object.assign(n, { repeats: 1 }); Object.assign(c, { mode: 'double' });
    challenge.title = /Sorting/.test(lesson.title) ? 'Comparison counter' : /Tests|Debug/.test(lesson.title) ? 'Fixture rover' : 'Accumulator rover';
    challenge.instruction = `${mode === 'count' ? 'Count visited cases' : 'Add visited values'} until the output is ${target}. Stop before the next step changes the answer.`;
    challenge.connection = 'A loop executes one body per visit. The accumulator and stopping condition determine the result; one extra iteration can break an otherwise correct program.';
    challenge.hint = `Choose ${mode}, then visit ${repeats} of the ${values.length} inputs. ${mode === 'sum' ? values.slice(0, repeats).join(' + ') : 'One visit counts as one case.'}`;
    challenge.action = 'Check loop';
  } else if (kind === 'sort') {
    const descending = productivity || /Refactor/.test(lesson.title);
    const tuple = python && index === 6;
    const values = descending ? [18, 42, 12, 30] : [8, 3, 6, 1];
    Object.assign(s, { direction: descending ? 'descending' : 'ascending', collection: tuple ? 'tuple' : 'list' });
    challenge.items = values.map((value, i) => item(`record-${i}`, productivity ? ['Docs', 'Sheets', 'Slides', 'Notion'][i] : `Value ${value}`, productivity ? `${value} tasks completed.` : `Numeric value: ${value}`, { value }));
    challenge.initial.order = challenge.items.map(entry => entry.id); c.direction = descending ? 'ascending' : 'descending';
    challenge.title = tuple ? 'New tuple conveyor' : productivity ? 'Report ranking' : /Refactor/.test(lesson.title) ? 'Complexity conveyor' : 'List conveyor';
    challenge.instruction = `${tuple ? 'Construct a separate sorted tuple while the original tuple stays unchanged. ' : ''}Move records into ${descending ? 'largest to smallest' : 'smallest to largest'} order and choose the matching sort direction. ${tuple ? 'Each adjacent move edits the new collection.' : 'Each adjacent move changes the working list.'}`;
    challenge.connection = tuple ? 'A tuple cannot be sorted in place. sorted(original) builds a separate list; tuple(sorted(original)) creates a new tuple and preserves the immutable original.' : productivity ? 'Sort the rows, not just the displayed numbers, so labels remain attached to their data.' : 'Sorting compares values and returns an ordered collection. The direction changes the ordering rule, not the input values.';
    challenge.hint = `The first value should be ${descending ? Math.max(...values) : Math.min(...values)}. Every adjacent pair must follow the same rule.`;
    challenge.action = 'Check order';
  } else if (kind === 'lookup') {
    let labels = ['brief', 'evidence', 'draft', 'review'];
    let values: number[] | string[] = [6, 12, 4, 8];
    let key = 'evidence'; let transform = 'identity'; let target: string | number = 12;
    if (python && index === 3) { labels = ['greeting', 'message', 'name', 'empty']; values = ['Hi', 'Learning', 'Ada', '']; key = 'message'; transform = 'length'; target = 8; }
    else if (python && index === 1) { labels = ['child', 'teen', 'adult', 'unknown']; values = ['under 13', '13–17', '18 or older', 'missing age']; key = 'adult'; target = '18 or older'; }
    else if (python && index === 5) { labels = ['name', 'age', 'city', 'role']; values = ['Ada', '24', 'Tokyo', 'learner']; key = 'city'; target = 'Tokyo'; }
    else if (python && index === 6) { labels = ['0', '1', '2', '3']; values = ['north', 'east', 'south', 'west']; key = '2'; target = 'south'; }
    else if (python) { labels = ['first', 'second', 'third', 'fourth']; values = [4, 7, 12, 3]; key = 'third'; target = 12; }
    else if (react) { labels = ['title', 'count', 'step', 'disabled']; values = [4, 6, 2, 0]; key = 'count'; transform = 'double'; target = 12; }
    else if (design) { labels = ['ink', 'space', 'radius', 'body']; values = [24, 8, 4, 16]; key = 'space'; target = 8; }
    else if (productivity && /Docs/.test(lesson.title)) { labels = ['viewer', 'commenter', 'editor', 'owner']; values = ['read only', 'suggest feedback', 'change content', 'manage access']; key = 'commenter'; target = 'suggest feedback'; }
    else if (productivity) { labels = ['A1', 'B2', 'C3', 'D4']; values = [14, 24, 42, 8]; key = 'C3'; target = 42; }
    else if (/Context|Codebase|Session|Projects/.test(lesson.title)) { labels = ['README', 'tests', 'source', 'archive']; values = [2, 12, 6, 24]; key = /Context|Session/.test(lesson.title) ? 'README' : 'tests'; target = key === 'README' ? 2 : 12; }
    Object.assign(s, { values, keys: labels, target, expectedKey: key, transform, collection: python && index === 6 ? 'tuple' : python && index === 3 ? 'string' : python ? 'dictionary' : react ? 'props' : design ? 'tokens' : productivity && !/Docs/.test(lesson.title) ? 'cells' : 'context' });
    challenge.items = labels.map((label, i) => item(label, label, `Stored value: ${values[i]}`, { value: typeof values[i] === 'number' ? values[i] as number : undefined }));
    Object.assign(c, { key: labels[0], transform: transform === 'identity' ? 'double' : 'identity' });
    challenge.title = python && index === 3 ? 'String microscope' : python && index === 1 ? 'Classifier result drawer' : python && index === 5 ? 'Dictionary drawer' : python && index === 6 ? 'Tuple index explorer' : react ? 'Props inspector' : design ? 'Token cabinet' : productivity && /Docs/.test(lesson.title) ? 'Collaboration permissions' : productivity ? 'Cell address explorer' : 'Context explorer';
    challenge.instruction = `Find the named record “${key}”${transform === 'length' ? ' and measure its character count' : transform === 'double' ? ' and double its value' : ' and read it without changing it'}. Deliver ${JSON.stringify(target)}.`;
    challenge.connection = python && index === 6 ? 'Tuple positions begin at zero. Reading an index retrieves a value without changing the immutable collection.' : python && index === 1 ? 'A classifier must return the category associated with its branch. Check the output contract as well as the if condition.' : python && index === 5 ? 'A dictionary retrieves a value by its key, rather than by its visual position.' : python && index === 3 ? 'A string is a sequence of characters. len(text) counts those characters without modifying the text.' : design ? 'Reusable design tokens give one named source of truth for values used across instances.' : productivity && /Docs/.test(lesson.title) ? 'Collaboration roles grant different capabilities. Give a reviewer commenting rights when they need feedback without changing the document.' : productivity ? 'A spreadsheet cell address identifies one exact row and column. Formulas must reference the intended cell.' : 'Choose relevant context by its name, then preserve or deliberately transform its value. A nearby record can contain a completely different answer.';
    challenge.hint = `Select “${key}” and ${transform === 'identity' ? 'keep the stored value' : transform === 'length' ? 'measure length' : 'multiply by two'}.`;
    challenge.action = 'Read value';
  } else if (kind === 'grid') {
    const column = /Social|Resize|Handoff/.test(lesson.title);
    Object.assign(s, { container: 360, widths: [80, 100, 80], targetDirection: column ? 'column' : 'row', targetAlign: course.id === 'advanced-css' ? 'space-between' : 'center', minGap: 12, maxGap: 40 });
    challenge.items = [item('one', course.id === 'advanced-css' ? 'Home' : 'Card A', '80 px', { value: 80 }), item('two', course.id === 'advanced-css' ? 'Courses' : 'Card B', '100 px', { value: 100 }), item('three', course.id === 'advanced-css' ? 'Profile' : 'Card C', '80 px', { value: 80 })];
    Object.assign(c, { direction: column ? 'row' : 'column', align: 'start' }); n.gap = 4;
    challenge.title = course.id === 'advanced-css' ? 'Flexbox playground' : /Components/.test(lesson.title) ? 'Auto-layout instances' : column ? 'Responsive stack' : 'Auto-layout canvas';
    challenge.instruction = `Arrange the three items in a ${column ? 'column' : 'row'} with ${s.targetAlign === 'space-between' ? 'even space between items' : 'center alignment'} and a gap of 12–40 px. Keep the row inside its 360 px container.`;
    challenge.connection = course.id === 'advanced-css' ? 'flex-direction sets the main axis; justify-content distributes free space. The browser recomputes the positions from these constraints.' : 'Auto layout describes relationships between items. Direction, alignment and gap produce a predictable layout when content changes.';
    challenge.hint = `Set ${column ? 'column' : 'row'}, ${s.targetAlign}, and 16 px. On a row, widths plus both gaps must fit 360 px.`;
    challenge.action = 'Test layout';
  } else if (kind === 'layout') {
    const caption = /Caption/.test(lesson.title);
    Object.assign(s, { minHeading: caption ? 30 : 28, maxHeading: 42, minBody: 16, maxBody: 22, minAction: 16, maxAction: 24, targetAlign: /Presentation|Slides|PowerPoint/.test(lesson.title) ? 'center' : 'left' });
    challenge.items = [item('heading', short(project, 40), 'The main message'), item('body', short(objective, 95), 'The supporting detail'), item('action', 'Try the next step', 'The action a reader should find')];
    Object.assign(n, { heading: 18, body: 24, action: 12 }); c.align = s.targetAlign === 'left' ? 'center' : 'left';
    challenge.title = caption ? 'Text readability stage' : /Word|Resume/.test(lesson.title) ? 'Resume hierarchy' : /Writing/.test(lesson.title) ? 'Draft hierarchy' : /Presentation|Slides|PowerPoint/.test(lesson.title) ? 'Slide hierarchy' : 'Visual hierarchy';
    challenge.instruction = `Make the heading clearly lead the body, keep the body at 16–22 px and the action at 16–24 px. Align the composition ${s.targetAlign}. Watch the actual typography change.`;
    challenge.connection = 'Hierarchy makes the important message easy to find. Type sizes need a clear relationship; increasing every size equally does not establish a reading order.';
    challenge.hint = `Try heading 32, body 18, action 20, with ${s.targetAlign} alignment. Heading should be at least 1.5 times body size.`;
    challenge.action = 'Read the composition';
  } else if (kind === 'contrast') {
    Object.assign(s, { inks: ['#20242b', '#335cff', '#9299a8', '#ffffff'], backgrounds: ['#ffffff', '#e9edff', '#335cff', '#20242b'], minRatio: 4.5 });
    c.ink = '#9299a8'; c.background = '#ffffff';
    challenge.items = [item('preview', short(project, 40), 'The same message must remain readable at normal text size.')];
    challenge.title = /Brand/.test(lesson.title) ? 'Brand contrast lab' : /Typography/.test(lesson.title) ? 'Type and color lab' : 'Contrast lab';
    challenge.instruction = 'Choose ink and paper colors that give normal text a contrast ratio of at least 4.5:1. The measurement updates from the colors themselves.';
    challenge.connection = 'Brand colors still need to support reading. Relative luminance, rather than how vivid a color feels, determines contrast.';
    challenge.hint = 'Dark ink on white, or white on dark ink, gives a strong ratio. Blue on pale blue may need checking.';
    challenge.action = 'Measure contrast';
  } else if (kind === 'timeline') {
    const continuity = /Continuity/.test(lesson.title);
    Object.assign(s, { minDuration: 1, maxDuration: 6, budgetMin: continuity ? 8 : 9, budgetMax: continuity ? 12 : 13, required: ['hook', 'demo', 'proof', 'close'], opening: 'hook', closing: 'close' });
    challenge.items = [item('hook', 'Open the problem', 'Give the viewer a reason to watch.', { category: 'hook', value: 2 }), item('demo', 'Show the action', short(objective, 80), { category: 'demo', value: 4 }), item('proof', 'Reveal the result', short(project, 55), { category: 'proof', value: 3 }), item('close', 'Finish clearly', 'Leave one next step.', { category: 'close', value: 2 }), item('detour', 'Unrelated flourish', 'A 5-second transition interrupts the lesson.', { category: 'detour', value: 5 })];
    challenge.initial.order = ['proof', 'detour', 'hook', 'demo', 'close']; challenge.items.forEach(entry => { n[entry.id] = entry.value || 2; });
    challenge.title = continuity ? 'Continuity edit' : /Effects/.test(lesson.title) ? 'Cut the distraction' : 'Story timeline';
    challenge.instruction = `Build a ${s.budgetMin}–${s.budgetMax} second edit: problem → action → result → close. Remove the unrelated flourish and trim clips to make the time budget.`;
    challenge.connection = 'Editing creates meaning through order and duration. A result shown before its cause can confuse the viewer; a decorative detour competes with the teaching moment.';
    challenge.hint = 'Place hook, demo, proof, close. A 2 + 4 + 3 + 2 second edit is 11 seconds.';
    challenge.action = 'Review the edit';
  } else if (kind === 'mix') {
    Object.assign(s, { voiceMin: 60, voiceMax: 85, musicMax: 30, effectsMax: 20, headroom: 110 });
    Object.assign(n, { voice: 40, music: 65, effects: 35 });
    challenge.items = [item('voice', 'Narration', 'The instruction must remain clear.'), item('music', 'Music', 'Support the rhythm without covering the words.'), item('effects', 'Effects', 'Keep accents below the lesson voice.')];
    challenge.title = /Sound/.test(lesson.title) ? 'Voice-first mixing desk' : 'Narration balance';
    challenge.instruction = 'Mix a clear narration: voice 60–85%, music at most 30%, effects at most 20%. Keep voice at least twice as loud as music and leave combined headroom below 110%.';
    challenge.connection = 'A mix is a balance between tracks. Turning everything up can hide speech and consume headroom even if each individual track sounds fine.';
    challenge.hint = 'Voice 70%, music 20%, effects 10% preserves room for speech and accents.';
    challenge.action = 'Check the mix';
  } else if (kind === 'caption') {
    const captionText = 'Show one action clearly then reveal what changed';
    Object.assign(s, { speechStart: 2, speechEnd: 6, clipLength: 9, minFont: 24, maxFont: 40, maxLineChars: 28, text: captionText });
    Object.assign(c, { wrap: 'single' }); Object.assign(n, { start: 0, end: 3, font: 16 });
    challenge.items = [item('speech', captionText, 'The voice speaks from 2.0 to 6.0 seconds.')];
    challenge.title = /Export/.test(lesson.title) ? 'Sound-off delivery test' : 'Caption timing room';
    challenge.instruction = 'Make the caption cover the spoken phrase from 2–6 seconds, split it into readable phrases, and set 24–40 px text. Keep it within the nine-second clip.';
    challenge.connection = 'Captions need both readable typography and time alignment. A correct sentence displayed after the action still fails the viewer.';
    challenge.hint = 'Set start 2, end 6, font 30, and phrase wrapping. The longest line must stay under 28 characters.';
    challenge.action = 'Preview caption';
  } else if (kind === 'camera') {
    const motion = /higgsfield/.test(course.id);
    const move = motion && /Motion|Prompt|Pipeline/.test(lesson.title) ? 'dolly' : /Timeline|Effects/.test(lesson.title) ? 'pan' : 'locked';
    Object.assign(s, { xMin: 38, xMax: 62, yMin: 38, yMax: 62, zoomMin: 70, zoomMax: 95, angleMin: -12, angleMax: 12, move });
    Object.assign(n, { x: 18, y: 75, zoom: 95, angle: 30 }); c.move = move === 'locked' ? 'pan' : 'locked';
    challenge.items = [item('subject', 'Teaching subject', 'Keep the subject inside the safe center.'), item('background', 'Reference frame', 'A level view and consistent scale preserve continuity.')];
    challenge.title = /Social|Resize/.test(lesson.title) ? 'Safe-crop camera' : /Continuity/.test(lesson.title) ? 'Match the reference shot' : motion ? 'Motion blocking stage' : 'Frame the teaching moment';
    challenge.instruction = `Frame the subject inside x/y 38–62%, use 70–95% scale and a level angle (±12°). Choose ${move} motion so the shot follows the brief.`;
    challenge.connection = move === 'locked' ? 'A stable reference frame prevents unplanned movement and protects the subject when the format changes.' : 'A motion brief constrains framing, subject scale and camera movement. Changing all of them at once makes continuity hard to control.';
    challenge.hint = `Try x 50, y 50, zoom 85, angle 0, and ${move}. Any framing inside the safe range is valid.`;
    challenge.action = 'Preview shot';
  } else if (kind === 'evidence') {
    Object.assign(s, { topic: subject });
    challenge.items = [
      item('primary', 'Original record', `${subject}: inspectable source material with a dated method and direct observations.`, { category: 'primary' }),
      item('independent', 'Independent check', `A second organization independently checked the same bounded question and reports its method.`, { category: 'independent' }),
      item('rumor', 'Reposted claim', 'An anonymous screenshot repeats a claim; there is no original source or method.', { category: 'rumor' }),
      item('old', 'Superseded note', 'An old draft explicitly marked superseded by the current original record.', { category: 'outdated' }),
    ];
    challenge.title = /Context/.test(lesson.title) ? 'Context quality desk' : /Review/.test(lesson.title) ? 'Risk evidence desk' : 'Source triage desk';
    challenge.instruction = 'Sort sources into keep or reject. Keep inspectable original evidence and an independent check; reject the untraceable repost and the superseded draft.';
    challenge.connection = research ? 'Research quality depends on provenance, methods and independent verification. Two reposts of one claim do not count as two independent sources.' : 'Relevant material can still be unreliable. Inspect where it came from before it becomes context for a consequential decision.';
    challenge.hint = 'Read the provenance in every source card. Primary and independent evidence belong in keep; a rumor and an outdated draft do not.';
    challenge.action = 'Inspect source set';
  } else if (kind === 'claim') {
    Object.assign(s, { links: ['claim-a:source-a', 'claim-b:source-b'] });
    const review = !research;
    challenge.items = [
      item('claim-a', review ? 'The work meets the main requirement' : 'The tested group improved', review ? `The requirement is: ${short(objective, 100)}` : 'Limit the conclusion to the tested group.', { category: 'claim' }),
      item('claim-b', review ? 'The result was checked before delivery' : 'The evidence has a stated limit', review ? `Checks must match ${short(project, 65)}.` : 'A short trial does not establish long-term outcomes.', { category: 'claim' }),
      item('source-a', review ? 'Requirement trace' : 'Trial report', review ? 'A trace maps the delivered output to the exact brief and records a passing acceptance check.' : 'In a trial of 20 volunteers, 14 improved after one week.', { category: 'source' }),
      item('source-b', review ? 'Verification record' : 'Scope note', review ? 'A dated record lists the tested cases, result and known limitations before publication.' : 'The report measures only one week and does not study long-term outcomes.', { category: 'source' }),
      item('source-noise', 'Unsupported assertion', 'Someone says everything is perfect; no inspectable supporting record exists.', { category: 'source' }),
    ];
    c.certainty = 'absolute';
    challenge.title = research ? 'Evidence-to-claim board' : design ? 'Design acceptance board' : 'Acceptance trace';
    challenge.instruction = 'Attach the specific supporting record to each claim and choose bounded certainty. A strong-sounding assertion cannot replace a relevant source.';
    challenge.connection = 'A claim must be supported by evidence that addresses that exact claim. Record the limits so the conclusion stays within what was actually checked.';
    challenge.hint = 'Match the main requirement or trial result to its original record; match verification or scope to its own note. Choose bounded certainty.';
    challenge.action = 'Verify claims';
  } else if (kind === 'query') {
    const recent = research || /Tool|Context/.test(lesson.title);
    Object.assign(s, { requireRecent: recent ? 1 : 0, topic: short(subject, 65), region: research ? 'local community' : 'selected project', period: 'current year' });
    Object.assign(c, { scope: 'broad', source: 'any', time: 'any' });
    challenge.items = [
      item('primary-current', research ? 'Current local study' : 'Current project specification', `${short(project, 75)}: original material for the selected project, with a current method and stated limits.`, { category: 'primary' }),
      item('primary-old', research ? 'Archived local study' : 'Archived project specification', 'Outdated original material from a prior version; the current project has changed.', { category: 'primary' }),
      item('secondary', 'Commentary on the project', 'A third-party interpretation summarizes the work but does not provide its original method.', { category: 'secondary' }),
      item('broad', 'General worldwide overview', 'A broad survey discusses many unrelated audiences and projects.', { category: 'broad' }),
    ];
    challenge.title = prompt ? 'Brief lens' : research ? 'Search lens' : 'Context request lens';
    challenge.instruction = `Turn a broad request into a bounded question for ${short(project, 60)}. Require primary material${recent ? ' and current information' : ''}. Watch the actual request become more specific.`;
    challenge.connection = prompt ? 'An output contract begins with a concrete job and relevant context. A broad request makes it difficult to evaluate whether the response did the intended work.' : 'Scope and source constraints change which information answers your question. A long list of results can still fail to address a bounded decision.';
    challenge.hint = `Choose bounded scope, primary sources${recent ? ', and recent information' : ''}.`;
    challenge.action = prompt ? 'Send brief' : 'Run search';
  } else if (kind === 'budget') {
    const contextBudget = /Context|Prompt|Anatomy/.test(lesson.title);
    const production = /higgsfield|capcut|canva|figma/.test(course.id) || /Motion|Design/.test(lesson.title);
    Object.assign(s, { limit: 10, required: ['core', 'check'], minValue: 10, unit: contextBudget ? 'tokens' : production ? 'credits' : 'units' });
    challenge.items = [
      item('core', contextBudget ? 'Task and relevant context' : production ? 'Essential production pass' : 'Core delivery task', short(objective, 100), { category: 'essential', cost: 4, value: 6 }),
      item('check', contextBudget ? 'Acceptance contract' : 'Verification pass', 'Check the actual requirement before delivery.', { category: 'essential', cost: 3, value: 4 }),
      item('detail', contextBudget ? 'One useful example' : 'Focused improvement', 'Adds a small, relevant improvement.', { category: 'optional', cost: 2, value: 2 }),
      item('polish', contextBudget ? 'Extra background' : 'Optional polish', 'Useful only after the core and checks are covered.', { category: 'optional', cost: 3, value: 3 }),
      item('risk', contextBudget ? 'Unrelated full archive' : 'Uncontrolled extra scope', 'Consumes the budget and expands the task without a check.', { category: 'risky', cost: 7, value: 1 }),
    ];
    challenge.initial.selected = ['risk'];
    challenge.title = contextBudget ? 'Context budget' : production ? 'Production budget' : productivity ? 'Work-week planner' : 'Scope strategy';
    challenge.instruction = 'Spend at most 10 units. Cover the core task and its verification, earn at least 10 useful points, and keep uncontrolled scope out. Several efficient plans can succeed.';
    challenge.connection = 'Prioritization protects essential work and its checks. Spending the whole budget on attractive extras can leave the main deliverable unfinished.';
    challenge.hint = 'Core costs 4 and earns 6; checks cost 3 and earn 4. That passes at 7 units, with room for a focused extra.';
    challenge.action = 'Run plan';
  } else if (kind === 'sequence') {
    const developer = /codex|antigravity|react|Python/.test(course.id);
    const tuple = python && index === 6;
    const writing = /Docs|Word|Writing|Presentations|Slides|Narrative/.test(lesson.title);
    let labels = developer ? ['Define the contract', 'Inspect inputs', 'Perform the change', 'Test the result', 'Deliver'] : writing ? ['Define the reader', 'Outline the message', 'Draft the content', 'Review against the brief', 'Publish'] : ['Set the purpose', 'Gather relevant material', 'Build the first pass', 'Check the requirement', 'Deliver'];
    if (tuple) labels = ['Read the original tuple', 'Create a mutable copy', 'Change the copy', 'Build a new tuple', 'Check the original stayed unchanged'];
    if (python && index === 7) labels = ['Define the function', 'Pass the arguments', 'Execute the body', 'Return the value', 'Use the returned value'];
    if (python && index === 3) labels = ['Read the text', 'Choose the operation', 'Create a new string', 'Inspect the result', 'Keep the source unchanged'];
    if (/Components/.test(lesson.title)) labels = ['Define the component', 'Declare its props', 'Create an instance', 'Pass the prop values', 'Render the instance'];
    if (/Multi-Step|Work.*Challenge|Integrated/.test(lesson.title)) labels = ['Define the mission', 'Assign independent work', 'Integrate the outputs', 'Check the shared contract', 'Deliver'];
    const required = ['purpose', 'inspect', 'build', 'check', 'deliver'];
    Object.assign(s, { required, precedence: ['purpose:inspect', 'inspect:build', 'build:check', 'check:deliver'], optional: [] });
    challenge.items = [...labels.map((label, i) => item(required[i], label, i === 2 ? short(project, 85) : i === 3 ? 'Verify the result before it is used by the next step.' : 'This step has a dependency in the process.')), item('detour', tuple ? 'Overwrite the original tuple' : 'Skip the acceptance check', 'This shortcut breaks the process.', { category: 'detour' })];
    challenge.initial.order = ['deliver', 'purpose', 'detour', 'build', 'check', 'inspect'];
    challenge.title = tuple ? 'Immutable tuple recipe' : python && index === 7 ? 'Function call dominoes' : writing ? 'Editorial dominoes' : /Multi-Step/.test(lesson.title) ? 'Mission dependency chain' : 'Delivery dominoes';
    challenge.instruction = 'Build the dependency chain from purpose to delivery. Remove the shortcut. Each step must follow the work it depends on.';
    challenge.connection = tuple ? 'Tuples cannot be edited in place. Create a separate value, then verify that the source tuple is still intact.' : python && index === 7 ? 'A function receives arguments, runs its body and returns a value. Calling it before defining it, or using a result before returning it, breaks the flow.' : 'Sequencing exposes dependencies. Checking a result before it exists cannot verify it, and delivering it before checking hides avoidable errors.';
    challenge.hint = `Start with “${labels[0]}”, then ${labels.slice(1).join(' → ')}.`;
    challenge.action = 'Run process';
  } else if (kind === 'chart') {
    const trend = /PowerPoint|Presentation|Slides/.test(lesson.title);
    const share = /Campaign/.test(lesson.title);
    const repair = /Sheets|Excel/.test(lesson.title);
    const values = [12, 24, 18, 30];
    const labels = trend ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] : ['Design', 'Research', 'Motion', 'Review'];
    Object.assign(s, { task: trend ? 'trend' : share ? 'share' : 'compare', aggregate: /Excel|Analysis/.test(lesson.title) ? 'average' : 'sum', labels, values, repair: repair ? 1 : 0, units: 'completed tasks' });
    challenge.items = values.map((value, i) => item(`cell-${i}`, labels[i], `Source record: ${value} completed tasks.`, { value, category: labels[i] }));
    challenge.items.forEach(entry => { n[entry.id] = entry.value || 0; }); if (repair) n['cell-1'] = 42;
    Object.assign(c, { type: trend ? 'pie' : 'line', aggregate: s.aggregate === 'sum' ? 'average' : 'sum' });
    challenge.title = repair ? 'Spreadsheet repair & chart' : trend ? 'Trend story' : 'Evidence chart';
    challenge.instruction = `${repair ? 'Repair the mistyped cell against its source record. ' : ''}${trend ? 'Show how the values change across weeks' : share ? 'Show each category’s share of the total' : 'Compare the four named categories'}. Use ${s.aggregate} to summarize the values.`;
    challenge.connection = 'Charts communicate a specific relationship. Bars compare categories, lines connect ordered time points, and a pie shows parts of one total; source data and aggregation must stay honest.';
    challenge.hint = `${trend ? 'Choose a line chart' : share ? 'Choose a pie chart' : 'Choose bars'} and ${s.aggregate}. Keep every label attached to its source value.${repair ? ' The second source record is 24, not 42.' : ''}`;
    challenge.action = 'Publish data story';
  }
  return challenge;
}

export function buildLearningGamePlan(course: Course, lesson: Lesson): LearningGamePlan {
  const index = Math.max(0, course.lessons.findIndex(entry => entry.id === lesson.id));
  const objective = clean(lesson.objectives?.[0] || lesson.introduction.text);
  const project = clean(lesson.project.title);
  const family = getLessonLabFamily(course, lesson);
  // New instructor-authored material has a sensible subject fallback; the shipped
  // curriculum is explicitly mapped above and tested for coverage and variety.
  const fallback: Record<LearningGamePlan['family'], GameKind[]> = {
    code: ['code', 'branch', 'sequence'], prompt: ['query', 'budget', 'claim'],
    video: ['timeline', 'mix', 'caption'], research: ['query', 'evidence', 'claim'],
    design: ['grid', 'layout', 'contrast'], creative: ['camera', 'budget', 'sequence'],
  };
  const kinds = curriculum[course.id]?.[index] || fallback[family];
  const context: Context = { course, lesson, index, title: clean(lesson.title), project, objective, subject: clean(lesson.title).split(':')[0] };
  return {
    id: `learning-games:${course.id}:${lesson.id}`, title: project,
    lessonTitle: clean(lesson.title), projectTitle: project,
    teaching: clean(lesson.keyTakeaways?.[0] || objective), family,
    challenges: kinds.map((kind, round) => createChallenge(context, kind, round)),
  };
}

export function createGameState(challenge: GameChallenge): GameState {
  return { choices: { ...challenge.initial.choices }, numbers: { ...challenge.initial.numbers }, order: [...challenge.initial.order], groups: { ...challenge.initial.groups }, selected: [...challenge.initial.selected] };
}

/** Invalid IDs and non-finite inputs cannot enter the simulation state. */
export function applyGameAction(challenge: GameChallenge, state: GameState, action: GameAction): GameState {
  const next = { choices: { ...state.choices }, numbers: { ...state.numbers }, order: [...state.order], groups: { ...state.groups }, selected: [...state.selected] };
  if (action.type === 'choice') next.choices[action.key] = action.value;
  else if (action.type === 'number' && Number.isFinite(action.value)) next.numbers[action.key] = clamp(action.value, -10000, 10000);
  else if (action.type === 'toggle' && challenge.items.some(entry => entry.id === action.id)) next.selected = next.selected.includes(action.id) ? next.selected.filter(id => id !== action.id) : [...next.selected, action.id];
  else if (action.type === 'group' && challenge.items.some(entry => entry.id === action.id)) next.groups[action.id] = action.group;
  else if (action.type === 'order' && challenge.items.some(entry => entry.id === action.id)) {
    next.order = next.order.filter(id => id !== action.id);
    if (Number.isFinite(action.index) && action.index >= 0) next.order.splice(clamp(Math.floor(action.index), 0, next.order.length), 0, action.id);
  } else if (action.type === 'swap' && Number.isInteger(action.index) && action.index >= 0 && action.index < next.order.length - 1) {
    [next.order[action.index], next.order[action.index + 1]] = [next.order[action.index + 1], next.order[action.index]];
  }
  return next;
}

function calculate(operation: string, input: number) {
  return operation === 'double' ? input * 2 : operation === 'square' ? input ** 2 : operation === 'sum' ? input * (input + 1) / 2 : operation === 'add-one' ? input + 1 : NaN;
}

export function gameContrastRatio(ink: string, background: string) {
  const luminance = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return NaN;
    const channels = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(ink), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function evaluateGame(challenge: GameChallenge, state: GameState): GameEvaluation {
  const checks: GameEvaluation['checks'] = [];
  const check = (label: string, passed: boolean) => { checks.push({ label, passed }); };
  const n = (key: string) => state.numbers[key] ?? 0;
  const c = (key: string) => state.choices[key] || '';
  const inRange = (key: string, min: number, max: number) => Number.isFinite(n(key)) && n(key) >= min && n(key) <= max;
  let output = '';
  switch (challenge.kind) {
    case 'code': {
      const result = calculate(c('operation'), n('input'));
      check('Use the requested expression', c('operation') === string(challenge, 'operation'));
      check('Keep an integer input inside the range', Number.isInteger(n('input')) && inRange('input', number(challenge, 'inputMin'), number(challenge, 'inputMax')));
      check(`Produce ${number(challenge, 'target')}`, result === number(challenge, 'target'));
      output = `${n('input')} → ${c('operation') || '?'} → ${Number.isFinite(result) ? result : 'invalid expression'}`;
      break;
    }
    case 'branch': {
      if (string(challenge, 'mode') === 'checks') {
        const review = challenge.settings.reviewFlags as number[];
        const tests = challenge.settings.testFlags as number[];
        const desired = strings(challenge, 'expectedRoutes');
        const route = (index: number) => c('rule') === '&&' ? Boolean(review[index] && tests[index]) : c('rule') === '||' ? Boolean(review[index] || tests[index]) : false;
        check('Choose a supported logical operator', ['&&', '||'].includes(c('rule')));
        challenge.items.forEach((entry, index) => check(`${entry.label} → ${desired[index]}`, (route(index) ? 'accept' : 'reject') === desired[index]));
        output = `Released: ${challenge.items.filter((_, index) => route(index)).map(entry => entry.label).join(', ') || 'none'} · held: ${challenge.items.filter((_, index) => !route(index)).length}`;
        break;
      }
      const route = (value: number) => c('rule') === '>=' ? value >= n('threshold') : c('rule') === '>' ? value > n('threshold') : c('rule') === '<' ? value < n('threshold') : c('rule') === '===' ? value === n('threshold') : false;
      const desired = strings(challenge, 'expectedRoutes');
      check('Use a supported comparison', ['>=', '>', '===', '<'].includes(c('rule')) && inRange('threshold', number(challenge, 'thresholdMin'), number(challenge, 'thresholdMax')));
      challenge.items.forEach((entry, i) => check(`${entry.label} → ${desired[i]}`, (route(entry.value || 0) ? 'accept' : 'reject') === desired[i]));
      output = `Accepted: ${challenge.items.filter(entry => route(entry.value || 0)).map(entry => entry.value).join(', ') || 'none'} · Rejected: ${challenge.items.filter(entry => !route(entry.value || 0)).map(entry => entry.value).join(', ') || 'none'}`;
      break;
    }
    case 'loop': {
      const repeats = n('repeats');
      const visited = challenge.items.slice(0, clamp(Math.floor(repeats), 0, challenge.items.length));
      const sum = visited.reduce((total, entry) => total + (entry.value || 0), 0);
      const result = c('mode') === 'count' ? visited.length : c('mode') === 'double' ? sum * 2 : c('mode') === 'sum' ? sum : NaN;
      check('Choose the intended accumulator', c('mode') === string(challenge, 'mode'));
      check('Use whole visits within the input', Number.isInteger(repeats) && inRange('repeats', 1, number(challenge, 'maxRepeats')));
      check(`Reach ${number(challenge, 'target')} without an extra visit`, result === number(challenge, 'target'));
      output = `${visited.map(entry => entry.value).join(' → ')} · ${c('mode')}: ${Number.isFinite(result) ? result : '?'}`;
      break;
    }
    case 'sort': {
      const values = state.order.map(id => challenge.items.find(entry => entry.id === id)?.value);
      check('Preserve every record exactly once', state.order.length === challenge.items.length && new Set(state.order).size === challenge.items.length && challenge.items.every(entry => state.order.includes(entry.id)));
      check('Choose the requested direction', c('direction') === string(challenge, 'direction'));
      for (let index = 1; index < values.length; index++) check(`Pair ${index} is ordered`, values[index] !== undefined && values[index - 1] !== undefined && (c('direction') === 'ascending' ? values[index - 1]! <= values[index]! : c('direction') === 'descending' && values[index - 1]! >= values[index]!));
      output = values.map(value => value ?? '?').join(' → ');
      break;
    }
    case 'lookup': {
      const index = challenge.items.findIndex(entry => entry.id === c('key'));
      const values = challenge.settings.values as (string | number)[];
      const stored = index < 0 ? undefined : values?.[index] ?? challenge.items[index].value;
      const result = c('transform') === 'length' ? String(stored ?? '').length : c('transform') === 'double' && typeof stored === 'number' ? stored * 2 : c('transform') === 'identity' ? stored : undefined;
      check('Read the intended address', c('key') === string(challenge, 'expectedKey'));
      check('Apply the intended transformation', c('transform') === string(challenge, 'transform'));
      check('Return the requested result', result === challenge.settings.target);
      output = `${c('key') || '?'} → ${JSON.stringify(stored) ?? 'missing'} → ${JSON.stringify(result) ?? 'invalid transform'}`;
      break;
    }
    case 'grid': {
      const widths = challenge.settings.widths as number[];
      const occupied = widths.reduce((a, b) => a + b, 0) + n('gap') * Math.max(0, widths.length - 1);
      check('Use the intended main axis', c('direction') === string(challenge, 'targetDirection'));
      check('Distribute items using the intended alignment', c('align') === string(challenge, 'targetAlign'));
      check('Leave useful spacing', inRange('gap', number(challenge, 'minGap'), number(challenge, 'maxGap')));
      check('Keep items inside the container', c('direction') === 'column' || occupied <= number(challenge, 'container'));
      output = `${c('direction')} · ${c('align')} · gap ${n('gap')} px · ${c('direction') === 'row' ? `${occupied}/${number(challenge, 'container')} px used` : 'items stack vertically'}`;
      break;
    }
    case 'layout': {
      check('Heading is legible and controlled', inRange('heading', number(challenge, 'minHeading'), number(challenge, 'maxHeading')));
      check('Body text is readable', inRange('body', number(challenge, 'minBody'), number(challenge, 'maxBody')));
      check('Action text remains readable', inRange('action', number(challenge, 'minAction'), number(challenge, 'maxAction')));
      check('Heading leads the hierarchy', n('body') > 0 && n('heading') / n('body') >= 1.5);
      check('Alignment follows the composition brief', c('align') === string(challenge, 'targetAlign'));
      output = `Heading ${n('heading')} / body ${n('body')} / action ${n('action')} px · ratio ${n('body') ? (n('heading') / n('body')).toFixed(2) : '?'} · ${c('align')}`;
      break;
    }
    case 'contrast': {
      const ratio = gameContrastRatio(c('ink'), c('background'));
      check('Choose colors from the palette', strings(challenge, 'inks').includes(c('ink')) && strings(challenge, 'backgrounds').includes(c('background')));
      check('Normal text meets 4.5:1', Number.isFinite(ratio) && ratio >= number(challenge, 'minRatio'));
      output = `${Number.isFinite(ratio) ? ratio.toFixed(2) : '?'}:1 contrast · ${c('ink')} on ${c('background')}`;
      break;
    }
    case 'timeline': {
      const required = strings(challenge, 'required');
      const duration = state.order.reduce((sum, id) => sum + n(id), 0);
      check('Include each teaching beat once', required.every(id => state.order.includes(id)) && new Set(state.order).size === state.order.length);
      check('Remove unrelated footage', state.order.every(id => challenge.items.some(entry => entry.id === id && entry.category !== 'detour')));
      check('Open the problem and finish clearly', state.order[0] === string(challenge, 'opening') && state.order.at(-1) === string(challenge, 'closing'));
      check('Show the action before its result', state.order.includes('demo') && state.order.indexOf('demo') < state.order.indexOf('proof'));
      check('Give each clip a usable duration', state.order.every(id => inRange(id, number(challenge, 'minDuration'), number(challenge, 'maxDuration'))));
      check('Fit the edit budget', duration >= number(challenge, 'budgetMin') && duration <= number(challenge, 'budgetMax'));
      output = `${state.order.map(id => challenge.items.find(entry => entry.id === id)?.label || '?').join(' → ')} · ${duration.toFixed(1)} seconds`;
      break;
    }
    case 'mix': {
      const total = n('voice') + n('music') + n('effects');
      check('Voice remains the lead', inRange('voice', number(challenge, 'voiceMin'), number(challenge, 'voiceMax')));
      check('Music supports rather than masks', inRange('music', 0, number(challenge, 'musicMax')) && n('voice') >= 2 * n('music'));
      check('Effects stay below the voice', inRange('effects', 0, number(challenge, 'effectsMax')));
      check('Preserve combined headroom', Number.isFinite(total) && total <= number(challenge, 'headroom'));
      output = `Voice ${n('voice')}% · music ${n('music')}% · effects ${n('effects')}% · combined ${total}%`;
      break;
    }
    case 'caption': {
      const text = string(challenge, 'text');
      const lines = c('wrap') === 'phrases' ? phraseLines(text, number(challenge, 'maxLineChars')) : [text];
      check('Cover the whole spoken phrase', n('start') <= number(challenge, 'speechStart') && n('end') >= number(challenge, 'speechEnd'));
      check('Stay synchronized and inside the clip', inRange('start', Math.max(0, number(challenge, 'speechStart') - 0.5), number(challenge, 'speechStart')) && inRange('end', number(challenge, 'speechEnd'), Math.min(number(challenge, 'clipLength'), number(challenge, 'speechEnd') + 0.5)) && n('start') < n('end'));
      check('Text is legible without filling the frame', inRange('font', number(challenge, 'minFont'), number(challenge, 'maxFont')));
      check('Phrase lines fit the reading width', ['single', 'phrases'].includes(c('wrap')) && lines.every(line => line.length <= number(challenge, 'maxLineChars')));
      output = `${n('start').toFixed(1)}–${n('end').toFixed(1)}s · ${n('font')} px · ${lines.join(' / ')}`;
      break;
    }
    case 'camera': {
      check('Keep the subject inside the safe area', inRange('x', number(challenge, 'xMin'), number(challenge, 'xMax')) && inRange('y', number(challenge, 'yMin'), number(challenge, 'yMax')));
      check('Preserve the reference scale', inRange('zoom', number(challenge, 'zoomMin'), number(challenge, 'zoomMax')));
      check('Keep the view level', inRange('angle', number(challenge, 'angleMin'), number(challenge, 'angleMax')));
      check('Follow the planned camera move', c('move') === string(challenge, 'move'));
      output = `${c('move')} · (${n('x')}%, ${n('y')}%) · scale ${n('zoom')}% · angle ${n('angle')}°`;
      break;
    }
    case 'evidence': {
      challenge.items.forEach(entry => check(`${entry.label}: ${['primary', 'independent'].includes(entry.category || '') ? 'keep' : 'reject'}`, state.groups[entry.id] === (['primary', 'independent'].includes(entry.category || '') ? 'keep' : 'reject')));
      const kept = challenge.items.filter(entry => state.groups[entry.id] === 'keep');
      output = `Kept: ${kept.map(entry => entry.label).join(', ') || 'none'} · ${kept.filter(entry => entry.category === 'independent').length} independent check`;
      break;
    }
    case 'claim': {
      const links = strings(challenge, 'links');
      links.forEach(link => { const [claim, source] = link.split(':'); check(`${challenge.items.find(entry => entry.id === claim)?.label || claim} has relevant support`, c(claim) === source); });
      check('State bounded certainty', c('certainty') === 'bounded');
      output = `${links.filter(link => { const [claim, source] = link.split(':'); return c(claim) === source; }).length}/${links.length} claims supported · certainty: ${c('certainty') || 'unset'}`;
      break;
    }
    case 'query': {
      check('Bound the decision to its audience and project', c('scope') === 'bounded');
      check('Ask for original evidence', c('source') === 'primary');
      check('Use the required time window', number(challenge, 'requireRecent') ? c('time') === 'recent' : ['any', 'recent'].includes(c('time')));
      output = `${c('scope') === 'bounded' ? `${string(challenge, 'topic')} for ${string(challenge, 'region')}` : `${string(challenge, 'topic')} — everything`} · ${c('source') === 'primary' ? 'original sources with methods' : 'any sources'}${c('time') === 'recent' ? ` · ${string(challenge, 'period')}` : ' · any date'}`;
      break;
    }
    case 'budget': {
      const selected = challenge.items.filter(entry => state.selected.includes(entry.id));
      const cost = selected.reduce((sum, entry) => sum + (entry.cost || 0), 0);
      const value = selected.reduce((sum, entry) => sum + (entry.value || 0), 0);
      check('Cover the essential work and its checks', strings(challenge, 'required').every(id => state.selected.includes(id)));
      check('Keep scope inside the resource limit', cost <= number(challenge, 'limit'));
      check('Deliver enough useful work', value >= number(challenge, 'minValue'));
      check('Reject uncontrolled scope', selected.every(entry => entry.category !== 'risky') && state.selected.every(id => challenge.items.some(entry => entry.id === id)) && new Set(state.selected).size === state.selected.length);
      output = `${cost}/${number(challenge, 'limit')} units spent · ${value} useful points · ${selected.map(entry => entry.label).join(', ') || 'nothing planned'}`;
      break;
    }
    case 'sequence': {
      check('Include each required step exactly once', strings(challenge, 'required').every(id => state.order.includes(id)) && new Set(state.order).size === state.order.length);
      check('Remove the shortcut', state.order.every(id => challenge.items.some(entry => entry.id === id && entry.category !== 'detour')));
      strings(challenge, 'precedence').forEach(pair => { const [before, after] = pair.split(':'); check(`${challenge.items.find(entry => entry.id === before)?.label} precedes ${challenge.items.find(entry => entry.id === after)?.label}`, state.order.includes(before) && state.order.includes(after) && state.order.indexOf(before) < state.order.indexOf(after)); });
      output = state.order.map(id => challenge.items.find(entry => entry.id === id)?.label || '?').join(' → ');
      break;
    }
    case 'chart': {
      const values = challenge.items.map(entry => state.numbers[entry.id] ?? entry.value ?? 0);
      const targetValues = challenge.settings.values as number[];
      const type = string(challenge, 'task') === 'trend' ? 'line' : string(challenge, 'task') === 'share' ? 'pie' : 'bar';
      check('Keep the data faithful to its source records', values.every((value, index) => Number.isFinite(value) && value === targetValues[index]));
      check('Choose a chart for the intended relationship', c('type') === type);
      check('Use the requested aggregation', c('aggregate') === string(challenge, 'aggregate'));
      const sum = values.reduce((a, b) => a + b, 0);
      output = `${c('type')} · ${c('aggregate')}: ${c('aggregate') === 'average' ? sum / values.length : sum} ${string(challenge, 'units')} · values ${values.join(', ')}`;
      break;
    }
  }
  const passed = checks.length > 0 && checks.every(entry => entry.passed);
  const remaining = checks.find(entry => !entry.passed);
  return { passed, progress: checks.length ? checks.filter(entry => entry.passed).length / checks.length : 0, checks, output, feedback: passed ? `${challenge.title} works. ${challenge.connection}` : `${remaining?.label || 'Change the experiment'}. ${challenge.hint}` };
}

function phraseLines(text: string, max: number) {
  const lines = [''];
  text.split(' ').forEach(word => { const last = lines.length - 1; if (lines[last] && `${lines[last]} ${word}`.length > max) lines.push(word); else lines[last] += `${lines[last] ? ' ' : ''}${word}`; });
  return lines;
}

/** Reference state for automated checks. The product never imports this helper. */
export function solveGame(challenge: GameChallenge): GameState {
  const state = createGameState(challenge);
  const s = challenge.settings;
  switch (challenge.kind) {
    case 'code': {
      state.choices.operation = string(challenge, 'operation');
      for (let input = number(challenge, 'inputMin'); input <= number(challenge, 'inputMax'); input++) if (calculate(state.choices.operation, input) === number(challenge, 'target')) { state.numbers.input = input; break; }
      break;
    }
    case 'branch': state.choices.rule = string(challenge, 'expectedRule', '>='); state.numbers.threshold = number(challenge, 'threshold'); break;
    case 'loop': state.choices.mode = string(challenge, 'mode'); state.numbers.repeats = number(challenge, 'repeats'); break;
    case 'sort': state.choices.direction = string(challenge, 'direction'); state.order = [...challenge.items].sort((a, b) => state.choices.direction === 'ascending' ? a.value! - b.value! : b.value! - a.value!).map(entry => entry.id); break;
    case 'lookup': state.choices.key = string(challenge, 'expectedKey'); state.choices.transform = string(challenge, 'transform'); break;
    case 'grid': state.choices.direction = string(challenge, 'targetDirection'); state.choices.align = string(challenge, 'targetAlign'); state.numbers.gap = 16; break;
    case 'layout': state.numbers = { heading: 32, body: 18, action: 20 }; state.choices.align = string(challenge, 'targetAlign'); break;
    case 'contrast': state.choices.ink = '#20242b'; state.choices.background = '#ffffff'; break;
    case 'timeline': state.order = strings(challenge, 'required'); challenge.items.forEach(entry => { state.numbers[entry.id] = entry.value || 2; }); break;
    case 'mix': state.numbers = { voice: 70, music: 20, effects: 10 }; break;
    case 'caption': state.choices.wrap = 'phrases'; state.numbers = { start: 2, end: 6, font: 30 }; break;
    case 'camera': state.numbers = { x: 50, y: 50, zoom: 85, angle: 0 }; state.choices.move = string(challenge, 'move'); break;
    case 'evidence': challenge.items.forEach(entry => { state.groups[entry.id] = ['primary', 'independent'].includes(entry.category || '') ? 'keep' : 'reject'; }); break;
    case 'claim': strings(challenge, 'links').forEach(pair => { const [claim, source] = pair.split(':'); state.choices[claim] = source; }); state.choices.certainty = 'bounded'; break;
    case 'query': state.choices = { scope: 'bounded', source: 'primary', time: number(challenge, 'requireRecent') ? 'recent' : 'any' }; break;
    case 'budget': state.selected = strings(challenge, 'required'); break;
    case 'sequence': state.order = strings(challenge, 'required'); break;
    case 'chart': state.choices = { type: string(challenge, 'task') === 'trend' ? 'line' : string(challenge, 'task') === 'share' ? 'pie' : 'bar', aggregate: string(challenge, 'aggregate') }; challenge.items.forEach((entry, index) => { state.numbers[entry.id] = (s.values as number[])[index]; }); break;
  }
  return state;
}
