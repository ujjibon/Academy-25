import type { SketchCaption, SketchChapterKind, SketchLessonStoryboard } from './visual-lessons';

export type NarratedSketchManifest = {
  id: string;
  courseId: string;
  lessonId: number;
  generated: true;
  chapters: Array<{ id: SketchChapterKind; url: string; durationMs: number }>;
};

export const SKETCH_NARRATION_LEAD_MS = 500;
export const SKETCH_NARRATION_TRAIL_MS = 800;
const MAX_FILM_MS = 15 * 60 * 1000;
const MIN_SPEECH_MS = 500;
const MAX_SPEECH_MS = 180000;
const CHAPTERS: readonly SketchChapterKind[] = ['overview', 'build', 'example', 'repair', 'apply'];
const HEX_ID = /^[a-f0-9]{64}$/;
const AUDIO_URL = /^\/api\/learning\/narration\/audio\/[a-f0-9]{64}$/;
const COURSE_ID = /^[A-Za-z0-9][A-Za-z0-9-]{0,95}$/;
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);
const normalize = (value: string) => words(value).join(' ');
const narrationError = () => new Error('This lesson’s narration is incomplete or does not match the lesson. Please generate it again.');

/** Accept only bounded, same-origin recordings for the lesson being displayed. */
export function isNarratedSketchManifest(value: unknown, courseId: string, lessonId: number): value is NarratedSketchManifest {
  if (!COURSE_ID.test(courseId) || !Number.isSafeInteger(lessonId) || lessonId < 1 || lessonId > 100000) return false;
  if (!record(value) || typeof value.id !== 'string' || !HEX_ID.test(value.id)
    || value.courseId !== courseId || value.lessonId !== lessonId || value.generated !== true
    || !Array.isArray(value.chapters) || value.chapters.length !== CHAPTERS.length) return false;
  const ids = new Set<string>();
  let durationMs = 0;
  for (const chapter of value.chapters) {
    if (!record(chapter) || typeof chapter.id !== 'string' || !CHAPTERS.includes(chapter.id as SketchChapterKind)
      || ids.has(chapter.id) || typeof chapter.url !== 'string' || !AUDIO_URL.test(chapter.url)
      || typeof chapter.durationMs !== 'number' || !Number.isFinite(chapter.durationMs)
      || chapter.durationMs < MIN_SPEECH_MS || chapter.durationMs > MAX_SPEECH_MS) return false;
    ids.add(chapter.id);
    durationMs += chapter.durationMs + SKETCH_NARRATION_LEAD_MS + SKETCH_NARRATION_TRAIL_MS;
  }
  return durationMs <= MAX_FILM_MS;
}

/** Fit authored captions to recorded speech without shortening or rewriting it.
 * Frame rounding adds at most one frame of extra trailing space per chapter.
 * Caption timing remains in milliseconds so the first and final words align
 * with the actual audio rather than a rounded animation frame.
 */
export function applySketchNarration(base: SketchLessonStoryboard, manifest: NarratedSketchManifest): SketchLessonStoryboard {
  const identity = typeof base.id === 'string' ? /^([A-Za-z0-9][A-Za-z0-9-]{0,95}):([1-9]\d{0,5})$/.exec(base.id) : null;
  if (!identity || !isNarratedSketchManifest(manifest, identity[1], Number(identity[2]))
    || !Number.isInteger(base.fps) || base.fps < 1 || base.fps > 120
    || !Array.isArray(base.chapters) || base.chapters.length !== CHAPTERS.length || !Array.isArray(base.captions)) throw narrationError();

  const ids = new Set<SketchChapterKind>();
  let oldEndFrame = 0;
  for (const chapter of base.chapters) {
    if (!CHAPTERS.includes(chapter.id) || ids.has(chapter.id) || !Number.isInteger(chapter.startFrame)
      || chapter.startFrame !== oldEndFrame || !Number.isInteger(chapter.durationInFrames) || chapter.durationInFrames <= 0
      || typeof chapter.narration !== 'string' || !words(chapter.narration).length) throw narrationError();
    ids.add(chapter.id);
    oldEndFrame += chapter.durationInFrames;
  }
  if (oldEndFrame !== base.durationInFrames) throw narrationError();
  let previousCaptionEnd = 0;
  for (const caption of base.captions) {
    if (typeof caption.text !== 'string' || !words(caption.text).length || !Number.isFinite(caption.startMs)
      || !Number.isFinite(caption.endMs) || caption.startMs < previousCaptionEnd - 0.001
      || caption.endMs <= caption.startMs || caption.endMs > oldEndFrame / base.fps * 1000 + 0.001) throw narrationError();
    previousCaptionEnd = caption.endMs;
  }

  let startFrame = 0;
  let assignedCaptions = 0;
  const captions: SketchCaption[] = [];
  const chapters = base.chapters.map(chapter => {
    const recording = manifest.chapters.find(item => item.id === chapter.id)!;
    const oldStartMs = chapter.startFrame / base.fps * 1000;
    const oldEndMs = (chapter.startFrame + chapter.durationInFrames) / base.fps * 1000;
    const existing = base.captions.filter(caption => caption.startMs >= oldStartMs - 0.001 && caption.startMs < oldEndMs - 0.001);
    assignedCaptions += existing.length;
    if (existing.some(caption => caption.endMs > oldEndMs + 0.001)) throw narrationError();
    // A storyboard without captions still keeps every narrated word. Existing
    // caption strings, punctuation, and metadata are otherwise preserved.
    const source: SketchCaption[] = existing.length ? existing : chapter.turns.flatMap(turn => turn.text.split(/(?<=[.!?])\s+/).map(text => ({ ...turn, text, startMs: 0, endMs: 0, timestampMs: null, confidence: null })));
    if (normalize(source.map(caption => caption.text).join(' ')) !== normalize(chapter.narration)) throw narrationError();
    const count = source.reduce((sum, caption) => sum + words(caption.text).length, 0);
    const speechStartMs = startFrame / base.fps * 1000 + SKETCH_NARRATION_LEAD_MS;
    let elapsedWords = 0;
    source.forEach(caption => {
      const captionStartMs = speechStartMs + recording.durationMs * elapsedWords / count;
      elapsedWords += words(caption.text).length;
      captions.push({ ...caption, startMs: captionStartMs, endMs: speechStartMs + recording.durationMs * elapsedWords / count });
    });
    const durationInFrames = Math.ceil((recording.durationMs + SKETCH_NARRATION_LEAD_MS + SKETCH_NARRATION_TRAIL_MS) * base.fps / 1000);
    const retimed = { ...chapter, startFrame, durationInFrames };
    startFrame += durationInFrames;
    return retimed;
  });
  if (assignedCaptions !== base.captions.length || startFrame / base.fps * 1000 > MAX_FILM_MS) throw narrationError();
  return {
    ...base, durationInFrames: startFrame, chapters, captions,
    project: { ...base.project }, labels: base.labels.map(label => ({ ...label })),
    code: base.code ? { ...base.code, lines: [...base.code.lines], trace: base.code.trace.map(step => ({ ...step })) } : null,
  };
}
