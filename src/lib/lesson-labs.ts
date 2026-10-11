import type { Course, Lesson } from '@/lib/data-provider';

export type LessonLabFamily = 'prompt' | 'video' | 'code' | 'research' | 'design' | 'creative';
export type LabPiece = { id: string; label: string; short: string; description: string; color: string; symbol: string };
export type LabControl = { key: 'first' | 'second'; label: string; min: number; max: number; step: number; unit: string; initial: number; target: [number, number]; reason: string };
export type LabState = { slots: (string | null)[]; first: number; second: number; safeguard: boolean };
export type LabCheck = { id: string; label: string; passed: boolean; feedback: string };
export type LabResult = { score: number; passed: boolean; checks: LabCheck[]; output: string; consequence: string };
export type LessonLab = {
  family: LessonLabFamily; title: string; subtitle: string; color: string; prefix: string;
  pieces: LabPiece[]; sequence: string[]; slotLabels: string[];
  controls: [LabControl, LabControl]; safeguardLabel: string; safeguardReason: string;
  briefing: string; lessonPrinciple: string; projectTitle: string;
  contextLines: string[]; operation: 'double' | 'sort' | 'uppercase' | 'count' | 'jsx';
  stages: { title: string; instruction: string }[];
};

const piece = (id: string, label: string, short: string, description: string, color: string, symbol: string): LabPiece => ({ id, label, short, description, color, symbol });
const control = (key: 'first' | 'second', label: string, min: number, max: number, step: number, unit: string, initial: number, target: [number, number], reason: string): LabControl => ({ key, label, min, max, step, unit, initial, target, reason });

/** Routing follows the subject of the lesson, so a capstone can visit several workshops. */
export function getLessonLabFamily(course: Pick<Course, 'id' | 'category'>, lesson: Pick<Lesson, 'title'>): LessonLabFamily {
  const title = lesson.title.toLowerCase();
  if (course.id === 'masters-creative-ai-capstone' || course.id === 'digital-productivity-mastery') {
    if (/research|analysis|sheets|excel/.test(title)) return 'research';
    if (/motion|capcut|video/.test(title)) return 'video';
    if (/figma|layout|word|presentation|slides|powerpoint|design/.test(title)) return 'design';
    if (/copy|message/.test(title)) return 'prompt';
    if (/notion|smart work|integrated|productivity/.test(title)) return 'code';
    return 'creative';
  }
  if (course.id === 'masters-perplexity' || (course.id === 'masters-claude' && /research|analysis/.test(title))) return 'research';
  if (course.id === 'masters-capcut' || course.id === 'masters-higgsfield') return 'video';
  if (course.id === 'masters-figma' || course.id === 'advanced-css') return 'design';
  if (course.id === 'masters-canva') return /layout|presentation/.test(title) ? 'design' : 'creative';
  if (course.id === 'masters-prompt-engineering' || course.id === 'masters-claude' || /prompt anatomy|writing agent briefs|context engineering/.test(title)) return 'prompt';
  if (course.category === 'programming' || /codex|antigravity|python|react/.test(course.id.toLowerCase())) return 'code';
  return 'creative';
}

const FAMILY_LABS: Record<LessonLabFamily, Omit<LessonLab, 'family' | 'briefing' | 'lessonPrinciple' | 'projectTitle' | 'contextLines' | 'operation' | 'stages'>> = {
  prompt: {
    title: 'Prompt foundry', subtitle: 'Build instructions. Watch the response change.', color: '#ad74ee', prefix: 'Prompt_',
    pieces: [
      piece('goal', 'Goal', 'Goal', 'Give the system one concrete job to do.', '#ad74ee', '◎'),
      piece('context', 'Context', 'Context', 'Give relevant background, audience, and supplied material.', '#77c8c2', '▤'),
      piece('limits', 'Constraints', 'Limits', 'Bound the work: scope, length, and things to avoid.', '#ffbd6b', '⌁'),
      piece('format', 'Output contract', 'Format', 'Describe the structure of the response you need.', '#ed8cac', '▦'),
      piece('verify', 'Acceptance check', 'Check', 'Check the output against the job before you use it.', '#89bc86', '✓'),
      piece('noise', 'Conflicting instruction', 'Noise', 'This asks for everything at once and obscures the main goal.', '#a0a4b3', '×'),
    ], sequence: ['goal', 'context', 'limits', 'format', 'verify'], slotLabels: ['Job', 'Background', 'Boundaries', 'Structure', 'Review'],
    controls: [
      control('first', 'Useful detail', 1, 5, 1, '/ 5', 1, [3, 4], 'Supply enough relevant detail to make the response specific without burying the task.'),
      control('second', 'Response budget', 40, 200, 10, 'words', 40, [80, 140], 'This brief needs 80–140 words: enough to explain a decision and short enough to review.'),
    ], safeguardLabel: 'Check the response against the brief', safeguardReason: 'A well-shaped instruction still needs an acceptance check.',
  },
  video: {
    title: 'Motion studio', subtitle: 'Cut a story. Play your edit.', color: '#ef9461', prefix: 'Video_',
    pieces: [
      piece('hook', 'Opening hook', 'Hook', 'Start with the problem or promise that makes a viewer stay.', '#ef9461', '▶'),
      piece('context', 'Set the scene', 'Scene', 'Give the viewer just enough context to understand the action.', '#82b9de', '▧'),
      piece('demo', 'Show the skill', 'Demo', 'Show one concrete action from the lesson instead of only explaining it.', '#b59adf', '✧'),
      piece('proof', 'Before → after', 'Result', 'Let the viewer see what the action changed.', '#87c1a5', '↔'),
      piece('ending', 'Clear ending', 'Ending', 'Finish with one next step the viewer can follow.', '#efba6c', '→'),
      piece('noise', 'Unrelated transition', 'Detour', 'A decorative detour adds time without helping the story.', '#a0a4b3', '×'),
    ], sequence: ['hook', 'context', 'demo', 'proof', 'ending'], slotLabels: ['Open', 'Orient', 'Demonstrate', 'Reveal', 'Close'],
    controls: [
      control('first', 'Shot length', 1, 8, 1, 'seconds', 8, [2, 4], 'For this miniature tutorial, use 2–4 seconds per shot so its five beats fit 10–20 seconds.'),
      control('second', 'Music under voice', 0, 100, 5, '%', 90, [15, 35], 'Keep the music below the lesson voice so the instruction remains clear.'),
    ], safeguardLabel: 'Enable readable captions', safeguardReason: 'Captions preserve the teaching point when the sound is off.',
  },
  code: {
    title: 'Pipeline workshop', subtitle: 'Wire a system. Run it on real sample values.', color: '#65b9c2', prefix: 'Code_',
    pieces: [
      piece('input', 'Receive input', 'Input', 'Read a small batch containing positive values and one invalid value.', '#65b9c2', '↓'),
      piece('validate', 'Validate data', 'Guard', 'Reject the invalid value before it enters the transformation.', '#efba6c', '◇'),
      piece('transform', 'Transform values', 'Work', 'Double each accepted value. The output preview actually runs this transformation.', '#ac92dc', '×2'),
      piece('test', 'Test the result', 'Test', 'Verify that all emitted values are positive and that each valid input was doubled.', '#89bc86', '✓'),
      piece('output', 'Deliver output', 'Output', 'Publish the transformed values after the checks.', '#ed8cac', '↑'),
      piece('noise', 'Skip the checks', 'Shortcut', 'This bypass sends unverified values directly to the output.', '#a0a4b3', '×'),
    ], sequence: ['input', 'validate', 'transform', 'test', 'output'], slotLabels: ['Receive', 'Guard', 'Transform', 'Test', 'Deliver'],
    controls: [
      control('first', 'Valid inputs per batch', 1, 12, 1, 'items', 10, [3, 6], 'Process at least three items, but fit the six-item memory budget of this tiny system.'),
      control('second', 'Concurrent workers', 1, 8, 1, 'workers', 6, [2, 3], 'This machine has three worker lanes. Use two or three to balance throughput and capacity.'),
    ], safeguardLabel: 'Reject invalid input', safeguardReason: 'Run the guard before the transformation so −1 never reaches the delivered result.',
  },
  research: {
    title: 'Evidence observatory', subtitle: 'Build a traceable claim. Inspect its support.', color: '#91b772', prefix: 'Research_',
    pieces: [
      piece('question', 'Bounded question', 'Question', 'Start with a question whose scope you can actually investigate.', '#91b772', '?'),
      piece('primary', 'Original source', 'Source', 'Keep the original material next to the claim it supports.', '#82b9de', '▤'),
      piece('compare', 'Cross-check', 'Compare', 'Compare independent evidence and investigate disagreements.', '#efba6c', '⇄'),
      piece('limits', 'Scope & limits', 'Limits', 'State what the evidence supports and what remains uncertain.', '#ac92dc', '◇'),
      piece('brief', 'Cited brief', 'Brief', 'Deliver the claim with its source trail and relevant limitations.', '#ed8cac', '▦'),
      piece('noise', 'Untraceable rumor', 'Rumor', 'This has no inspectable source, so it cannot support the brief.', '#a0a4b3', '×'),
    ], sequence: ['question', 'primary', 'compare', 'limits', 'brief'], slotLabels: ['Ask', 'Trace', 'Compare', 'Bound', 'Explain'],
    controls: [
      control('first', 'Independent sources', 1, 8, 1, 'sources', 1, [3, 6], 'The mission asks for three independent sources. Collecting more than six exceeds its review budget.'),
      control('second', 'Maximum source age', 1, 30, 1, 'months', 24, [1, 12], 'This mission is a current-state brief. Set a one-year recency window, then verify that each source fits.'),
    ], safeguardLabel: 'Show limitations with the claim', safeguardReason: 'A strong research brief distinguishes supported findings from unresolved questions.',
  },
  design: {
    title: 'Interface atelier', subtitle: 'Arrange a screen. See hierarchy and spacing live.', color: '#ed8cac', prefix: 'Design_',
    pieces: [
      piece('heading', 'Clear headline', 'Headline', 'Put the main purpose at the beginning of the reading order.', '#ed8cac', 'Aa'),
      piece('context', 'Supporting copy', 'Copy', 'Explain enough context to help the person choose an action.', '#82b9de', '▤'),
      piece('proof', 'Useful example', 'Example', 'Use a concrete sample or image to clarify the promise.', '#ac92dc', '▧'),
      piece('action', 'Primary action', 'Action', 'Give the screen one clear action with an understandable label.', '#efba6c', '→'),
      piece('detail', 'Secondary detail', 'Details', 'Place supporting detail after the main decision.', '#89bc86', '≡'),
      piece('noise', 'Competing callout', 'Clutter', 'A second primary callout competes with the screen’s purpose.', '#a0a4b3', '×'),
    ], sequence: ['heading', 'context', 'proof', 'action', 'detail'], slotLabels: ['Purpose', 'Context', 'Example', 'Action', 'Details'],
    controls: [
      control('first', 'Space between elements', 4, 32, 2, 'px', 4, [16, 24], 'Use a consistent 16–24 px rhythm for this screen so related blocks are easy to scan.'),
      control('second', 'Text contrast target', 3, 10, 0.5, ': 1', 3, [4.5, 10], 'Regular body text in this exercise needs a contrast ratio of at least 4.5:1.'),
    ], safeguardLabel: 'Show a visible focus outline', safeguardReason: 'A keyboard user needs to see which control currently has focus.',
  },
  creative: {
    title: 'Composition playground', subtitle: 'Direct a poster. Watch balance and cropping change.', color: '#efba6c', prefix: 'Creative_',
    pieces: [
      piece('brief', 'Single message', 'Message', 'Decide the one idea this visual should communicate.', '#efba6c', '◎'),
      piece('palette', 'Brand palette', 'Palette', 'Use a small, consistent set of colors across the visual.', '#ed8cac', '◒'),
      piece('subject', 'Focal subject', 'Subject', 'Place one focal object so the viewer knows where to look first.', '#82b9de', '✧'),
      piece('space', 'Breathing room', 'Space', 'Keep open space around the message and focal subject.', '#ac92dc', '▢'),
      piece('export', 'Delivery frame', 'Frame', 'Check that the composition stays inside the final delivery format.', '#89bc86', '▧'),
      piece('noise', 'Extra focal object', 'Clutter', 'This competes with your main subject and dilutes the message.', '#a0a4b3', '×'),
    ], sequence: ['brief', 'palette', 'subject', 'space', 'export'], slotLabels: ['Message', 'Palette', 'Focus', 'Space', 'Frame'],
    controls: [
      control('first', 'Subject size', 20, 95, 5, '%', 90, [45, 65], 'Make the subject 45–65% of the frame: visible enough to lead, with room for the message.'),
      control('second', 'Accent decorations', 0, 8, 1, 'accents', 7, [0, 3], 'Keep no more than three accents so the primary message stays dominant.'),
    ], safeguardLabel: 'Protect the safe area', safeguardReason: 'Check that text and the focal subject stay away from crop-sensitive edges.',
  },
};

const clean = (text: string) => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export function buildLessonLab(course: Course, lesson: Lesson): LessonLab {
  const family = getLessonLabFamily(course, lesson);
  const base = FAMILY_LABS[family];
  const principle = clean(lesson.keyTakeaways?.[0] || lesson.objectives?.[0] || lesson.introduction.text);
  const contextLines = [...(lesson.objectives || []), ...(lesson.keyTakeaways || []), ...(lesson.activities || []).map(activity => activity.description)]
    .map(clean).filter(Boolean);
  if (!contextLines.length) contextLines.push(clean(lesson.introduction.text), clean(lesson.project.description));
  let seed = 0;
  for (const letter of `${course.id}:${lesson.id}`) seed = (Math.imul(seed, 31) + letter.charCodeAt(0)) >>> 0;
  const controls = base.controls.map(item => ({ ...item, target: [...item.target] as [number, number] })) as [LabControl, LabControl];
  // These are explicit sandbox project constraints, not claims about an external tool.
  if (family === 'video') {
    controls[0].target = seed % 2 ? [2, 3] : [3, 4];
    controls[0].reason = `Your ${lesson.project.title} miniature needs five story beats of ${controls[0].target[0]}–${controls[0].target[1]} seconds each. Watch the timing in the player.`;
  } else if (family === 'code') {
    controls[0].target = [3, 4 + seed % 3];
    controls[0].reason = `This ${lesson.title} experiment needs at least three valid inputs and has a ${controls[0].target[1]}-item batch capacity. Inspect the actual values after running it.`;
  } else if (family === 'prompt') {
    controls[1].target = [80 + (seed % 3) * 10, 120 + (seed % 3) * 10];
    controls[1].reason = `The review budget for this ${lesson.project.title} miniature is ${controls[1].target[0]}–${controls[1].target[1]} words. Keep the response bounded by this output contract.`;
  } else if (family === 'research') {
    controls[0].target = [3, 4 + seed % 3];
    controls[0].reason = `This ${lesson.project.title} brief needs three independent source slots, with a review budget of ${controls[0].target[1]}. Source slots demonstrate the workflow; you still need to inspect real sources in your project.`;
  } else if (family === 'creative') {
    controls[0].target = [45 + (seed % 2) * 5, 60 + (seed % 2) * 5];
    controls[0].reason = `Your ${lesson.project.title} frame reserves space for its message. Keep its focal subject between ${controls[0].target[0]}% and ${controls[0].target[1]}% of the delivery frame.`;
  } else {
    controls[0].target = [16 + (seed % 3) * 2, 24];
    controls[0].reason = `The ${lesson.project.title} screen uses a shared ${controls[0].target[0]}–${controls[0].target[1]} px rhythm. Watch how this groups the live interface blocks.`;
  }
  const title = lesson.title.toLowerCase();
  const operation: LessonLab['operation'] = /sorting/.test(title) ? 'sort' : /strings|text/.test(title) && family === 'code' ? 'uppercase'
    : /jsx|components|props/.test(title) ? 'jsx' : /lists|dictionaries|tuples/.test(title) ? 'count' : 'double';
  const transformDescription = operation === 'sort' ? 'Sort each accepted batch into ascending order.'
    : operation === 'uppercase' ? 'Transform each accepted text label to uppercase.'
      : operation === 'jsx' ? 'Create a Card component for each accepted project label.'
        : operation === 'count' ? 'Count the accepted records and compare total with valid records.'
          : 'Double each accepted value.';
  const transformLabel = operation === 'sort' ? 'Sort the batch' : operation === 'uppercase' ? 'Transform text'
    : operation === 'jsx' ? 'Render components' : operation === 'count' ? 'Count records' : 'Transform values';
  return {
    ...base, family, controls, contextLines, operation,
    safeguardReason: family === 'code' && (operation === 'jsx' || operation === 'uppercase')
      ? 'Reject the empty label before transforming it, so the delivered artifact contains only useful project labels.'
      : base.safeguardReason,
    pieces: base.pieces.map((item, index) => {
      const specific = family === 'code' && item.id === 'transform' ? { ...item, label: transformLabel, short: operation === 'double' ? 'Work' : operation === 'jsx' ? 'Render' : operation === 'uppercase' ? 'Text' : operation === 'sort' ? 'Sort' : 'Count', description: `${transformDescription} The execution console runs this operation on real sample values.` }
        : family === 'code' && item.id === 'test' ? { ...item, description: 'Check the result for missing or invalid input, after the transformation and before delivery.' }
          : family === 'code' && item.id === 'input' ? { ...item, description: `Receive a small sample batch ${operation === 'jsx' || operation === 'uppercase' ? 'of project labels with an empty label' : 'of values with one invalid value'}.` } : item;
      return { ...specific, description: index < 5 ? `${specific.description} Lesson connection: ${contextLines[index % contextLines.length]}` : specific.description };
    }),
    lessonPrinciple: principle,
    projectTitle: lesson.project.title,
    briefing: clean(lesson.project.description),
    stages: [
      { title: 'Build a prototype', instruction: `Place the first three parts in their matching stations. Your miniature prototype prepares you for “${lesson.project.title}”.` },
      { title: 'Make it reliable', instruction: `Connect all five parts in order, then tune ${base.controls[0].label.toLowerCase()} to the mission range. Run the experiment and inspect what changed.` },
      { title: 'Ready to share', instruction: `Keep the working sequence, tune both controls to their mission ranges, and enable “${base.safeguardLabel}”. Inspect the result before you deliver.` },
    ],
  };
}

export function createInitialLabState(lab: LessonLab): LabState {
  return { slots: [null, null, null, null, null], first: lab.controls[0].initial, second: lab.controls[1].initial, safeguard: false };
}

/** A placed piece moves rather than copies, so one object cannot fill two stations. */
export function placeLabPiece(state: LabState, pieceId: string, slot: number): LabState {
  if (slot < 0 || slot >= state.slots.length) return state;
  const slots = state.slots.map(id => id === pieceId ? null : id);
  slots[slot] = pieceId;
  return { ...state, slots };
}

export function simulateLab(lab: LessonLab, state: LabState): { output: string; consequence: string; values: (number | string)[] } {
  const has = (id: string) => state.slots.includes(id);
  const ordered = lab.sequence.every((id, index) => state.slots[index] === id);
  const noisy = has('noise');
  const firstBelow = state.first < lab.controls[0].target[0];
  const firstAbove = state.first > lab.controls[0].target[1];
  const secondBelow = state.second < lab.controls[1].target[0];
  const secondAbove = state.second > lab.controls[1].target[1];
  if (lab.family === 'code') {
    const stringMode = lab.operation === 'uppercase' || lab.operation === 'jsx';
    const words = lab.projectTitle.split(/\s+/).filter(Boolean);
    let values: (number | string)[] = stringMode
      ? Array.from({ length: Math.round(state.first) }, (_, index) => words[index % words.length] || `Item ${index + 1}`).concat('')
      : Array.from({ length: Math.round(state.first) }, (_, index) => lab.operation === 'sort' ? Math.round(state.first) - index : index + 1).concat(-1);
    const events: string[] = [`input [${values.map(value => typeof value === 'string' ? JSON.stringify(value) : value).join(', ')}]`];
    let validInput = values.filter(value => typeof value === 'number' ? value > 0 : value.length > 0);
    for (const id of state.slots) {
      if (id === 'validate' && state.safeguard) { values = values.filter(value => typeof value === 'number' ? value > 0 : value.length > 0); validInput = [...values]; events.push(stringMode ? 'guard removed the empty value' : 'guard removed −1'); }
      if (id === 'transform') {
        if (lab.operation === 'sort') { values = [...values].sort((a, b) => Number(a) - Number(b)); events.push('sorted values ascending'); }
        else if (lab.operation === 'uppercase') { values = values.map(value => String(value).toUpperCase()); events.push('converted text to uppercase'); }
        else if (lab.operation === 'jsx') { values = values.map(value => `<Card label="${String(value)}" />`); events.push('created one component per label'); }
        else if (lab.operation === 'count') { values = [values.length, values.filter(value => Number(value) > 0).length]; events.push('counted total and valid records'); }
        else { values = values.map(value => Number(value) * 2); events.push('doubled accepted values'); }
      }
      if (id === 'test') {
        const valid = lab.operation === 'count' ? values[0] === validInput.length && values[1] === validInput.length
          : lab.operation === 'jsx' ? !values.some(value => String(value).includes('label=""'))
            : values.every(value => typeof value === 'number' ? value > 0 : value.length > 0);
        events.push(valid ? 'result check passed' : 'result check failed');
      }
      if (id === 'output') events.push(`delivered [${values.join(', ')}]`);
      if (id === 'noise') events.push('warning: unchecked shortcut');
    }
    return { output: events.join(' → '), values, consequence: !has('output') ? 'The values never reach a delivery station.' : !state.safeguard ? 'The invalid input survives. Turn on the guard and put it before the work.' : !ordered ? 'Order matters: a check after delivery cannot protect the delivered result.' : firstAbove || secondAbove ? 'The work exceeds this machine’s capacity. Reduce batch size or worker count.' : firstBelow ? 'The test batch is too small for this mission. Increase it to the indicated range.' : secondBelow ? 'A worker lane is idle. Use the indicated worker count to meet this mission’s throughput.' : 'The valid inputs are transformed, checked, and delivered within the machine’s capacity.' };
  }
  if (lab.family === 'video') return { values: [], output: `${state.slots.filter(Boolean).length} shots · ${state.slots.filter(Boolean).length * state.first}s · music ${state.second}% · captions ${state.safeguard ? 'on' : 'off'}`, consequence: noisy ? 'The unrelated shot interrupts the teaching sequence.' : !ordered ? 'The story has missing or misplaced beats. Put the action before its result.' : firstAbove ? 'The edit drags: the shots run longer than this project’s mission timing.' : firstBelow ? 'The edit rushes: the demonstration has too little time to be understood.' : secondAbove ? 'The music competes with the instruction. Lower it under the voice.' : secondBelow ? 'The mission’s soundtrack is too quiet. Bring it into the indicated mix range.' : !state.safeguard ? 'A viewer watching without sound cannot follow the instruction yet.' : 'The edit moves from a hook to a demonstration and result, with readable captions.' };
  if (lab.family === 'design') return { values: [], output: `${state.slots.filter(Boolean).length} interface blocks · ${state.first}px rhythm · ${state.second}:1 target · focus ${state.safeguard ? 'visible' : 'missing'}`, consequence: noisy ? 'Two competing callouts pull attention away from the primary action.' : !ordered ? 'The reading order is unclear. Give context before asking the person to act.' : firstBelow ? 'The blocks crowd together. Increase the shared spacing rhythm.' : firstAbove ? 'The blocks feel disconnected. Bring related content closer together.' : secondBelow ? 'The text lacks the contrast required by this brief.' : !state.safeguard ? 'Keyboard focus is invisible. Add the focus outline before delivery.' : 'The screen has one reading order, consistent spacing, readable text, and visible keyboard focus.' };
  if (lab.family === 'creative') return { values: [], output: `${has('subject') ? 'Focal subject' : 'No subject'} · ${state.first}% of frame · ${state.second} accents · safe area ${state.safeguard ? 'on' : 'off'}`, consequence: noisy ? 'The second focal object splits the visual’s message.' : !ordered ? 'The composition is missing part of its message, palette, subject, spacing, or delivery frame.' : firstAbove ? 'The subject dominates the frame and leaves too little breathing room for the message.' : firstBelow ? 'The subject is too small to guide attention.' : secondAbove ? 'The decorations compete with the focal subject. Remove some accents.' : !state.safeguard ? 'The message is close to a crop-sensitive edge. Enable and inspect the safe area.' : 'One subject leads the composition, with room for a clear message and a safe delivery crop.' };
  if (lab.family === 'research') return { values: [], output: `${has('question') ? 'Question defined' : 'Unbounded question'} → ${has('primary') ? `${state.first} traceable source slots` : 'no source trail'} → ${has('compare') ? 'comparison' : 'no cross-check'} → ${has('brief') ? 'brief' : 'no delivered brief'}`, consequence: noisy ? 'The rumor has no traceable evidence. Remove it from the chain.' : !ordered ? 'The brief is missing a trace, comparison, or stated scope.' : firstBelow ? 'One source cannot satisfy this mission’s three-source cross-check.' : firstAbove ? 'The source set exceeds the mission’s review budget. Select the most relevant independent material.' : secondAbove ? 'The recency window is too broad for this current-state brief.' : !state.safeguard ? 'The claim hides its limits. Keep uncertainty visible alongside the finding.' : 'The miniature brief keeps the question, source trail, comparison, and limitations together. Source slots model a workflow; they do not verify outside facts.' };
  return { values: [], output: `${has('goal') ? 'Concrete job' : 'Unclear job'} + ${has('context') ? 'lesson context' : 'missing context'} + ${has('limits') ? `${state.second}-word budget` : 'unbounded scope'} → ${has('format') ? 'structured response' : 'free-form response'} → ${has('verify') && state.safeguard ? 'reviewed draft' : 'unchecked draft'}`, consequence: noisy ? 'The conflicting instruction obscures the job. Remove it from the brief.' : !ordered ? 'The instruction lacks a clear goal, relevant context, boundaries, format, or review.' : firstBelow ? 'The brief is too vague. Add the relevant audience and task details.' : firstAbove ? 'The brief includes too much competing detail. Keep only the material needed for this job.' : secondBelow ? 'The response budget is too small for the explanation required by this mission.' : secondAbove ? 'The response exceeds the review budget. Tighten the output contract.' : !state.safeguard ? 'The response looks structured but has not been checked against its acceptance criteria.' : 'The instruction has a bounded job, relevant context, a usable output contract, and a review step. The preview is a simulation of the brief structure.' };
}

export function evaluateLab(lab: LessonLab, state: LabState, stage: number): LabResult {
  const checks: LabCheck[] = [];
  const required = stage === 0 ? 3 : 5;
  for (let index = 0; index < required; index += 1) {
    const expected = lab.pieces.find(item => item.id === lab.sequence[index])!;
    const actual = lab.pieces.find(item => item.id === state.slots[index]);
    checks.push({ id: `slot-${index}`, label: `${index + 1}. ${lab.slotLabels[index]}: ${expected.label}`, passed: state.slots[index] === expected.id, feedback: state.slots[index] === expected.id ? expected.description : `${actual ? `${actual.label} is in this station.` : 'This station is empty.'} ${expected.description}` });
  }
  if (stage >= 1) {
    const first = lab.controls[0];
    checks.push({ id: 'first', label: `${first.label}: ${first.target[0]}–${first.target[1]} ${first.unit}`, passed: state.first >= first.target[0] && state.first <= first.target[1], feedback: first.reason });
  }
  if (stage >= 2) {
    const second = lab.controls[1];
    checks.push({ id: 'second', label: `${second.label}: ${second.target[0]}–${second.target[1]} ${second.unit}`, passed: state.second >= second.target[0] && state.second <= second.target[1], feedback: second.reason });
    checks.push({ id: 'safeguard', label: lab.safeguardLabel, passed: state.safeguard, feedback: lab.safeguardReason });
  }
  const simulation = simulateLab(lab, state);
  return { checks, passed: checks.every(check => check.passed), score: Math.round(checks.filter(check => check.passed).length / checks.length * 100), output: simulation.output, consequence: simulation.consequence };
}
