import type { Course, Lesson } from '@/lib/data-provider';
import { getLessonDemonstration, type LessonDemonstration } from './lesson-demonstrations';

export type SketchVisualFamily = 'prompt' | 'code' | 'evidence' | 'design' | 'timeline' | 'workflow';
export type SketchChapterKind = 'overview' | 'build' | 'example' | 'repair' | 'apply';
export type SketchSpeaker = 'maya' | 'leo' | 'pip';
export type SketchTeachingTurn = { speaker: SketchSpeaker; text: string; traceIndex?: number; stepIndex?: number; experimentIndex?: number };
export type SketchCaption = SketchTeachingTurn & { startMs: number; endMs: number; timestampMs: null; confidence: null };
export type SketchChapter = { id: SketchChapterKind; title: string; narration: string; turns: SketchTeachingTurn[]; startFrame: number; durationInFrames: number };
export type SketchLabel = { label: string; detail: string };
export type SketchCodeTrace = { line: number; state: string; output: string; explanation?: string };
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
  demonstration: LessonDemonstration;
  code: { language?: string; lines: string[]; trace: SketchCodeTrace[] } | null;
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
  const demonstration = getLessonDemonstration(course, lesson);
  const family = demonstration.code ? 'code' : familyFor(course, lesson);
  const labels = labelsFor(family, lesson);
  const principle = demonstration.concept;
  const code = demonstration.code;
  const workedExample = demonstration.steps.map(step => step.action + ' ' + step.visibleResult + ' ' + step.reason).join(' ');
  const turn = (speaker: SketchSpeaker, text: string, focus: Partial<SketchTeachingTurn> = {}): SketchTeachingTurn => ({ speaker, text: text.replace(/`/g, '').replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim(), ...focus });
  const definitions: Array<{ id: SketchChapterKind; title: string; turns: SketchTeachingTurn[] }> = [
    { id: 'overview', title: 'Understand the idea', turns: [
      turn('maya', demonstration.goal + '. ' + demonstration.concept),
      turn('leo', 'I used to think: ' + demonstration.misconception.belief),
      turn('maya', demonstration.misconception.correction + ' ' + demonstration.why),
    ] },
    { id: 'build', title: 'See how it works', turns: demonstration.steps.flatMap((step, stepIndex) => [
      turn('maya', step.title + '. ' + step.action, { stepIndex }),
      turn('pip', step.visibleResult + '. ' + step.reason, { stepIndex }),
    ]) },
    { id: 'example', title: code ? 'Trace real code' : 'Compare two results', turns: code
      ? code.trace.map((step, traceIndex) => turn(traceIndex % 2 ? 'maya' : 'pip', step.explanation + ' The state is ' + step.state + (step.output ? '. The visible output is ' + step.output : '. There is no printed output yet.'), { traceIndex }))
      : demonstration.experiments.slice(0, 2).flatMap((example, experimentIndex) => [
        turn('leo', example.label + '. What happens with this input: ' + example.input + '?', { experimentIndex }),
        turn('pip', 'Here is the result: ' + example.result, { experimentIndex }),
        turn('maya', example.reason, { experimentIndex }),
      ]) },
    { id: 'repair', title: 'Predict, then explain', turns: [
      turn('leo', demonstration.prediction.question + ' Pause and choose: ' + demonstration.prediction.options.join('; ') + '.'),
      turn('maya', 'The answer is ' + demonstration.prediction.answer + '. ' + demonstration.prediction.explanation),
      turn('pip', 'Watch for this mistake: ' + demonstration.misconception.belief + ' ' + demonstration.misconception.correction),
    ] },
    { id: 'apply', title: 'Change it yourself', turns: [
      turn('maya', demonstration.transfer),
      turn('leo', 'How can I give the next attempt a clear direction?'),
      turn('maya', demonstration.prompt.whyBetter + ' Open Try, change one input, and explain the difference. Your project is ' + clean(lesson.project.title) + '. ' + clean(lesson.project.description)),
    ] },
  ];
  let startFrame = 0;
  const chapters = definitions.map(chapter => {
    const narration = chapter.turns.map(item => item.text).join(' ');
    const durationInFrames = Math.max(12, Math.ceil(narration.split(/\s+/).length / 2.5)) * fps;
    const result = { ...chapter, narration, startFrame, durationInFrames };
    startFrame += durationInFrames;
    return result;
  });
  const captions: SketchCaption[] = chapters.flatMap(chapter => {
    const count = chapter.narration.split(/\s+/).length;
    const startMs = chapter.startFrame / fps * 1000;
    const span = chapter.durationInFrames / fps * 1000;
    let wordIndex = 0;
    return chapter.turns.flatMap(item => {
      const words = item.text.split(/\s+/);
      const chunks: SketchCaption[] = [];
      for (let index = 0; index < words.length; index += 11) {
        const chunk = words.slice(index, index + 11);
        const from = wordIndex; wordIndex += chunk.length;
        chunks.push({ ...item, text: chunk.join(' '), startMs: startMs + span * from / count, endMs: startMs + span * wordIndex / count, timestampMs: null, confidence: null });
      }
      return chunks;
    });
  });
  return { id: course.id + ':' + lesson.id, title: lesson.title, courseTitle: course.title, family, variant: variantFor(family, lesson), fps, durationInFrames: startFrame, chapters, captions, project: { title: clean(lesson.project.title), description: clean(lesson.project.description) }, labels, principle, workedExample, demonstration, code };
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
