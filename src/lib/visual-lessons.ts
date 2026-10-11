import type { Course, Lesson } from '@/lib/data-provider';

export type SketchVisualFamily = 'prompt' | 'code' | 'evidence' | 'design' | 'timeline' | 'workflow';
export type SketchChapterKind = 'overview' | 'build' | 'example' | 'repair' | 'apply';
export type SketchCaption = { text: string; startMs: number; endMs: number; timestampMs: null; confidence: null };
export type SketchChapter = { id: SketchChapterKind; title: string; narration: string; startFrame: number; durationInFrames: number };
export type SketchLabel = { label: string; detail: string };
export type SketchCodeTrace = { line: number; state: string; output: string };
export type SketchLessonStoryboard = {
  id: string;
  title: string;
  courseTitle: string;
  family: SketchVisualFamily;
  variant: string;
  fps: number;
  durationInFrames: number;
  chapters: SketchChapter[];
  captions: SketchCaption[];
  project: { title: string; description: string };
  labels: SketchLabel[];
  principle: string;
  workedExample: string;
  code: { lines: string[]; trace: SketchCodeTrace[] } | null;
};

const clean = (text: string | undefined) => (text || '').replace(/[`*_#]/g, '').replace(/\s+/g, ' ').trim();
const firstSentence = (text: string) => clean(text).split(/(?<=[.!?])\s+/)[0] || clean(text);
const unique = (items: string[]) => [...new Set(items.map(clean).filter(Boolean))];

export const SKETCH_FAMILY_NAMES: Record<SketchVisualFamily, string> = {
  prompt: 'Prompt workshop', code: 'Code in motion', evidence: 'Evidence detective',
  design: 'Design laboratory', timeline: 'Motion edit bay', workflow: 'Workflow machine',
};

function familyFor(course: Course, lesson: Lesson): SketchVisualFamily {
  const id = course.id.toLowerCase();
  const topic = `${lesson.title} ${lesson.introduction.text}`.toLowerCase();
  if (/figma|canva|css/.test(id)) return 'design';
  if (/capcut|higgsfield/.test(id)) return 'timeline';
  if (/perplexity/.test(id) || /research|source|citation|verif|synthesis/.test(topic)) return 'evidence';
  if (/prompt|brief/.test(topic) && /codex|antigravity|prompt|claude/.test(id)) return 'prompt';
  if (/python|react|codex/.test(id)) return 'code';
  if (/prompt-engineering/.test(id)) return 'prompt';
  if (/creative-ai/.test(id) && /design|static/.test(topic)) return 'design';
  if (/creative-ai/.test(id) && /motion|edit/.test(topic)) return 'timeline';
  if (/claude/.test(id) && /prompt|contract/.test(topic)) return 'prompt';
  return 'workflow';
}

function codeFor(course: Course, lesson: Lesson): SketchLessonStoryboard['code'] {
  const title = lesson.title.toLowerCase();
  if (/python/i.test(course.id)) {
    if (/conditional|decision/.test(title)) return {
      lines: ['age = 16', 'if age < 13:', '    group = "child"', 'elif age < 18:', '    group = "teenager"', 'else:', '    group = "adult"', 'print(group)'],
      trace: [{ line: 0, state: 'age → 16', output: '' }, { line: 1, state: '16 < 13 → False', output: '' }, { line: 3, state: '16 < 18 → True', output: '' }, { line: 4, state: 'group → teenager', output: '' }, { line: 7, state: 'Chosen branch only', output: 'teenager' }],
    };
    if (/loop/.test(title)) return {
      lines: ['secret = 4', 'for guess in [2, 4]:', '    if guess == secret:', '        print("Found it!")', '        break', '    print("Try again")'],
      trace: [{ line: 0, state: 'secret → 4', output: '' }, { line: 1, state: 'guess → 2', output: '' }, { line: 5, state: '2 != 4', output: 'Try again' }, { line: 1, state: 'guess → 4', output: 'Try again' }, { line: 3, state: '4 == 4', output: 'Try again\nFound it!' }, { line: 4, state: 'Exit the loop', output: 'Try again\nFound it!' }],
    };
    if (/string|text/.test(title)) return {
      lines: ['sentence = "Learn by making"', 'words = sentence.split()', 'count = len(words)', 'print(count)'],
      trace: [{ line: 0, state: 'One string', output: '' }, { line: 1, state: '[Learn, by, making]', output: '' }, { line: 2, state: 'count → 3', output: '' }, { line: 3, state: 'Print the word count', output: '3' }],
    };
    if (/list/.test(title)) return {
      lines: ['tasks = ["Plan", "Build"]', 'tasks.append("Review")', 'print(tasks[0])', 'tasks.remove("Plan")', 'print(tasks)'],
      trace: [{ line: 0, state: '[Plan, Build]', output: '' }, { line: 1, state: '[Plan, Build, Review]', output: '' }, { line: 2, state: 'Index 0 → Plan', output: 'Plan' }, { line: 3, state: '[Build, Review]', output: 'Plan' }, { line: 4, state: 'Updated collection', output: 'Plan\n[Build, Review]' }],
    };
    if (/diction|key-value/.test(title)) return {
      lines: ['contacts = {"Maya": "555-0101"}', 'contacts["Leo"] = "555-0102"', 'number = contacts["Maya"]', 'print(number)'],
      trace: [{ line: 0, state: 'Maya → 555-0101', output: '' }, { line: 1, state: 'Leo → 555-0102', output: '' }, { line: 2, state: 'Look up the key Maya', output: '' }, { line: 3, state: 'number → 555-0101', output: '555-0101' }],
    };
    if (/tuple|immutable/.test(title)) return {
      lines: ['point = (3, 5)', 'x, y = point', 'print(x)', 'print(y)'],
      trace: [{ line: 0, state: 'Fixed pair → (3, 5)', output: '' }, { line: 1, state: 'Unpack: x → 3, y → 5', output: '' }, { line: 2, state: 'Read x', output: '3' }, { line: 3, state: 'Read y', output: '3\n5' }],
    };
    if (/function/.test(title)) return {
      lines: ['def greet(name):', '    return "Hello, " + name', 'message = greet("Maya")', 'print(message)'],
      trace: [{ line: 0, state: 'Define the reusable function', output: '' }, { line: 2, state: 'Call: name → Maya', output: '' }, { line: 1, state: 'Return → Hello, Maya', output: '' }, { line: 3, state: 'message → Hello, Maya', output: 'Hello, Maya' }],
    };
    if (/sort/.test(title)) return {
      lines: ['scores = [8, 3, 6]', 'ordered = sorted(scores)', 'print(ordered)', 'print(scores)'],
      trace: [{ line: 0, state: 'Original → [8, 3, 6]', output: '' }, { line: 1, state: 'New list → [3, 6, 8]', output: '' }, { line: 2, state: 'Ascending order', output: '[3, 6, 8]' }, { line: 3, state: 'Original stays unchanged', output: '[3, 6, 8]\n[8, 3, 6]' }],
    };
    return {
      lines: ['a = 8', 'b = 2', 'print(a + b)', 'print(a - b)', 'print(a * b)', 'print(a / b)'],
      trace: [{ line: 0, state: 'a → 8', output: '' }, { line: 1, state: 'b → 2', output: '' }, { line: 2, state: '8 + 2 → 10', output: '10' }, { line: 3, state: '8 - 2 → 6', output: '10\n6' }, { line: 4, state: '8 × 2 → 16', output: '10\n6\n16' }, { line: 5, state: '8 ÷ 2 → 4.0', output: '10\n6\n16\n4.0' }],
    };
  }
  if (/react/.test(course.id)) return /props/.test(title) ? {
    lines: ['function Greeting({name}) {', '  return <h1>Hello, {name}</h1>;', '}', '<Greeting name="Maya" />', '<Greeting name="Leo" />'],
    trace: [{ line: 3, state: 'name prop → Maya', output: '' }, { line: 1, state: 'Same component, first input', output: 'Hello, Maya' }, { line: 4, state: 'name prop → Leo', output: 'Hello, Maya' }, { line: 1, state: 'Same component, new input', output: 'Hello, Maya\nHello, Leo' }],
  } : {
    lines: ['const name = "Maya";', 'const element = (', '  <h1>Hello, {name}</h1>', ');', '// Render element in your app'],
    trace: [{ line: 0, state: 'name → Maya', output: '' }, { line: 2, state: '{name} reads JavaScript', output: '' }, { line: 3, state: 'JSX describes the interface', output: '' }, { line: 4, state: 'A heading appears', output: 'Hello, Maya' }],
  };
  return null;
}

function labelsFor(family: SketchVisualFamily, lesson: Lesson): SketchLabel[] {
  const checks = [...lesson.practice.questions, ...lesson.assessment.questions];
  // Answers to "what can go wrong?" need their question to make sense. They
  // still appear in the prediction chapter with that context, never as advice
  // on an isolated diagram card or in the mental-model narration.
  const standaloneChecks = checks.filter(item => !/\b(without|avoid|reduce|risk|wrong|incorrect|least|bad|problem|mistake|unsafe|never|forbidden|failure)\b|should(?:n’t|n't)\b/i.test(item.question));
  const facts = unique([...standaloneChecks.map(item => item.correctAnswer), firstSentence(lesson.introduction.text), ...(lesson.keyTakeaways || [])]);
  const named: Record<SketchVisualFamily, string[]> = {
    prompt: ['Goal', 'Context', 'Constraints', 'Output', 'Check'],
    code: ['Input', 'Understand', 'Change', 'Test', 'Ship'],
    evidence: ['Question', 'Primary source', 'Claim', 'Verify', 'Decision'],
    design: ['Frame', 'Hierarchy', 'Spacing', 'System', 'Review'],
    timeline: ['Hook', 'Story', 'Proof', 'Caption', 'Deliver'],
    workflow: ['Brief', 'Collect', 'Make', 'Review', 'Deliver'],
  };
  const topic = `${lesson.title} ${lesson.introduction.text}`.toLowerCase();
  let names = named[family];
  if (family === 'prompt' && /evaluation|rubric/.test(topic)) names = ['Correctness', 'Completeness', 'Format', 'Evidence', 'Revise'];
  else if (family === 'prompt' && /diagnosis|repair/.test(topic)) names = ['Observe', 'Classify', 'Repair one', 'Re-run', 'Compare'];
  else if (family === 'prompt' && /librar|governance/.test(topic)) names = ['Template', 'Owner', 'Version', 'Review', 'Reuse'];
  else if (family === 'prompt' && /plan.*critique|patterns/.test(topic)) names = ['Plan', 'Act', 'Critique', 'Transform', 'Check'];
  if (family === 'evidence' && /query/.test(topic)) names = ['Entity', 'Timeframe', 'Geography', 'Evidence', 'Query'];
  else if (family === 'evidence' && /triage|credib/.test(topic)) names = ['Primary?', 'Date', 'Incentives', 'Coverage', 'Credible?'];
  else if (family === 'evidence' && /claim|verif/.test(topic)) names = ['Claim', 'Source', 'Quote', 'Cross-check', 'Verdict'];
  if (family === 'workflow' && /mission|orchestrat/.test(topic)) names = ['Spike', 'Implement', 'Test', 'Polish', 'Review'];
  else if (family === 'workflow' && /writing/.test(topic)) names = ['Outline', 'Draft', 'Structure', 'Line edit', 'Voice'];
  else if (family === 'workflow' && /context/.test(topic)) names = ['Interface', 'Failing test', 'Error log', 'Nearby code', 'Review'];
  const questionTerms: Record<string, RegExp> = {
    Goal: /goal|intent|objective/, Context: /context|input|reference/, Constraints: /constraint|risk|avoid|rule|non.goal/, Output: /format|output|contract/, Check: /evaluat|check|review|test/,
    Frame: /frame|layout|grid/, Hierarchy: /hierarch|headline|dominant/, Spacing: /spac|white|gap|padding/, System: /system|component|consisten/, Review: /review|qa|check|handoff/,
    Question: /query|question|ask/, 'Primary source': /primary|source/, Claim: /claim/, Verify: /verif|cross.check/, Decision: /decision|brief/,
    Input: /input|context|spec/, Understand: /map|understand|explain/, Change: /refactor|change|implement/, Test: /test|assert|fixture/, Ship: /ship|deliver|pr/,
    Hook: /hook|first|attention/, Story: /story|rough|pacing/, Proof: /proof|demo|select/, Caption: /caption|text|read/, Deliver: /export|deliver|ratio/,
  };
  return names.map((label, index) => {
    const supported = questionTerms[label] ? standaloneChecks.find(item => questionTerms[label].test(item.question))?.correctAnswer : undefined;
    const detail = family === 'prompt' && label === 'Goal' ? `Build ${lesson.project.title}`
      : family === 'prompt' && label === 'Constraints' ? supported || 'Keep the project brief’s requirements'
      : family === 'prompt' && label === 'Output' ? lesson.project.description
        : supported || facts[index] || facts[index % Math.max(1, facts.length)] || lesson.project.description;
    return { label, detail: clean(detail) };
  });
}

function variantFor(family: SketchVisualFamily, lesson: Lesson) {
  // The introductory lesson often mentions every skill in a course. Its
  // diagram follows the lesson title rather than accidentally choosing one
  // specialty from that overview (for example, sound instead of edit planning).
  const topic = lesson.title.toLowerCase();
  if (family === 'design') return /auto layout|flex|grid|spacing/.test(topic) ? 'layout' : /component|variant|instance/.test(topic) ? 'components' : /color|type|brand/.test(topic) ? 'tokens' : /prototype|flow/.test(topic) ? 'prototype' : 'hierarchy';
  if (family === 'timeline') return /sound|music|mix/.test(topic) ? 'sound' : /caption|text|accessib/.test(topic) ? 'captions' : /export|handoff|delivery/.test(topic) ? 'export' : /style|continuity/.test(topic) ? 'continuity' : /motion|camera|prompt/.test(topic) ? 'camera' : 'edit';
  if (family === 'workflow') return /sheet|excel|data|analysis/.test(topic) ? 'spreadsheet' : /writing|draft|document|word|docs/.test(topic) ? 'document' : /presentation|slide|powerpoint/.test(topic) ? 'presentation' : 'pipeline';
  return family;
}

/** Builds a film from authored teaching, checkpoints, and the actual lesson project.
 * All catalog lessons work offline. Small code traces are explicit illustrative
 * examples of the named lesson concept, never fabricated student results.
 */
export function buildSketchLessonStoryboard(course: Course, lesson: Lesson): SketchLessonStoryboard {
  const fps = 30;
  const family = familyFor(course, lesson);
  const labels = labelsFor(family, lesson);
  const checks = [...lesson.practice.questions, ...lesson.assessment.questions];
  const principle = firstSentence(lesson.introduction.text) || lesson.title;
  const code = family === 'code' ? codeFor(course, lesson) : null;
  const workedExample = code
    ? `Follow this small ${/python/i.test(course.id) ? 'Python' : 'React'} example one line at a time. The highlighted line runs next. Watch the stored values change, then compare the output with your prediction.`
    : family === 'design'
      ? `Watch a rough composition become a usable system: establish a frame, make the main message dominant, create consistent spacing, and check the result at a smaller size. Apply the same reasoning to ${lesson.project.title}.`
      : family === 'timeline'
        ? `Watch the playhead move through the edit. Each visual choice has a job: establish the idea, show proof, keep the message readable, and deliver a clean result. Your project is ${lesson.project.title}.`
        : family === 'evidence'
          ? `Trace the path from a question to a source, from that source to a specific claim, and from a checked claim to a decision. A connection is only useful when you can explain the evidence behind it.`
          : family === 'prompt'
            ? `Build the instruction in layers. Start with the project goal, add the relevant context, make the constraints visible, name the expected output, and check it against the brief.`
            : `Follow one piece of work through the system. Inputs become a draft, the draft passes review, and only then does it become a deliverable. Each handoff needs a clear owner and a visible check.`;
  const checkpoint = checks[0];
  const repair = checkpoint
    ? `Pause and predict: ${clean(checkpoint.question)} The lesson-supported answer is ${clean(checkpoint.correctAnswer)}. Trace that answer back through the diagram. Then explain why it matters for ${lesson.project.title}.`
    : `Pause and predict what changes next. ${principle} Trace the input through each visible step before you reveal the result. If the output surprises you, replay the step where your prediction changed.`;
  const definitions: Array<{ id: SketchChapterKind; title: string; seconds: number; narration: string }> = [
    { id: 'overview', title: 'See the idea', seconds: 13, narration: clean(lesson.introduction.text) || principle },
    { id: 'build', title: 'Build the mental model', seconds: 16, narration: `The visual model breaks the work into ${labels.map(item => item.label.toLowerCase()).join(', ')}. ${unique(labels.slice(0, 3).map(item => item.detail)).join(' ')} Follow the moving marker to see how the parts connect.` },
    { id: 'example', title: 'Watch a worked example', seconds: 21, narration: workedExample },
    { id: 'repair', title: 'Pause, predict, check', seconds: 15, narration: repair },
    { id: 'apply', title: 'Make it yourself', seconds: 15, narration: `Your challenge: ${clean(lesson.project.title)}. ${clean(lesson.project.description)} ${clean(lesson.activities?.[0]?.description) || 'Use the visual model to plan a small first version, then check your result.'}` },
  ];
  let startFrame = 0;
  const chapters = definitions.map(({ seconds, ...chapter }) => {
    // Silent captions need enough time for the actual teaching text. Recorded
    // narration later retimes this storyboard to the measured speech duration.
    const readableSeconds = Math.max(seconds, Math.ceil(chapter.narration.split(/\s+/).length / 2.7));
    const result = { ...chapter, startFrame, durationInFrames: readableSeconds * fps };
    startFrame += result.durationInFrames;
    return result;
  });
  const captions: SketchCaption[] = chapters.flatMap(chapter => {
    const words = chapter.narration.split(/\s+/);
    const chunks: string[] = [];
    for (let index = 0; index < words.length; index += 11) chunks.push(words.slice(index, index + 11).join(' '));
    const startMs = chapter.startFrame / fps * 1000;
    const span = chapter.durationInFrames / fps * 1000;
    return chunks.map((text, index) => ({ text, startMs: startMs + span * index / chunks.length, endMs: startMs + span * (index + 1) / chunks.length, timestampMs: null, confidence: null }));
  });
  return { id: `${course.id}:${lesson.id}`, title: lesson.title, courseTitle: course.title, family, variant: variantFor(family, lesson), fps, durationInFrames: startFrame, chapters, captions, project: { title: clean(lesson.project.title), description: clean(lesson.project.description) }, labels, principle, workedExample, code };
}

/** Playback coverage is independent of the playhead: a seek adds zero credit. */
export function sketchViewingProgress(storyboard: SketchLessonStoryboard, viewedFrames: Uint8Array) {
  const chapterCoverage = storyboard.chapters.map(chapter => {
    let viewed = 0;
    for (let frame = chapter.startFrame; frame < chapter.startFrame + chapter.durationInFrames; frame++) viewed += viewedFrames[frame] ? 1 : 0;
    return viewed / chapter.durationInFrames;
  });
  const viewed = viewedFrames.reduce((sum, value) => sum + (value ? 1 : 0), 0);
  return { ratio: viewed / storyboard.durationInFrames, chapterCoverage, complete: viewed / storyboard.durationInFrames >= 0.85 && chapterCoverage.every(ratio => ratio >= 0.7) };
}
