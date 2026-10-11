import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getCourse } from './data-provider';
import { buildSketchLessonStoryboard, type SketchLessonStoryboard } from './visual-lessons';
import { isNarratedSketchManifest, SKETCH_NARRATION_LEAD_MS, SKETCH_NARRATION_TRAIL_MS, type NarratedSketchManifest } from './narrated-sketch';

const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'marin';
const VERSION = 'sketch-narration-marin-v1';
const INSTRUCTIONS = 'You are a calm, friendly drawing instructor explaining a visual lesson to a beginner. Use natural, clear English with a warm, focused tone. Speak at a measured teaching pace. Pause briefly between sentences and before a new example, so the learner can follow the drawing. Pronounce code names and technical terms clearly; read arrows as then. Read only the provided lesson narration, without adding an introduction, music, sound effects, or extra facts.';
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_DURATION_MS = 180_000;
const HASH = /^[a-f0-9]{64}$/;
const CHAPTER_KINDS = ['overview', 'build', 'example', 'repair', 'apply'];

export class SketchNarrationError extends Error {
  constructor(public readonly status: 400 | 404 | 429 | 503, message: string, public readonly retryAfter?: number) {
    super(message);
    this.name = 'SketchNarrationError';
  }
}
const unavailable = () => new SketchNarrationError(503, 'The lesson voice could not be prepared. Please try again.');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

/** Only catalog identifiers reach speech generation; client text is never relayed. */
export function resolveSketchNarrationLesson(courseId: unknown, lessonId: unknown): { courseId: string; lessonId: number; storyboard: SketchLessonStoryboard } {
  if (typeof courseId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(courseId)
    || typeof lessonId !== 'number' || !Number.isSafeInteger(lessonId) || lessonId < 1 || lessonId > 9999) {
    throw new SketchNarrationError(400, 'Valid course and lesson identifiers are required.');
  }
  const course = getCourse(courseId);
  const lesson = course?.lessons.find(item => String(item.id) === String(lessonId));
  if (!course || !lesson) throw new SketchNarrationError(404, 'Lesson not found.');
  const storyboard = buildSketchLessonStoryboard(course, lesson);
  if (storyboard.chapters.length !== 5 || storyboard.chapters.some((chapter, index) => chapter.id !== CHAPTER_KINDS[index]
    || !chapter.narration.trim() || chapter.narration.length > 4096)) throw unavailable();
  return { courseId: course.id, lessonId, storyboard };
}

export function sketchNarrationClipId(narration: string): string {
  return hash(JSON.stringify({ version: VERSION, model: MODEL, voice: VOICE, instructions: INSTRUCTIONS, input: narration }));
}

/** Native audio seeking uses one bounded byte range. */
export function sketchAudioRange(range: string, size: number): { start: number; end: number } | null {
  if (!Number.isSafeInteger(size) || size < 1) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || !match[1] && !match[2]) return null;
  let start: number, end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

type WavInfo = { durationMs: number; sampleRate: number; channels: number; dataBytes: number; dataChunks: Array<{ header: number; bytes: number }> };
/** Inspect real RIFF bytes. Streaming sentinel sizes are resolved from the body. */
export function inspectSketchNarrationWav(bytes: Uint8Array): WavInfo {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (buffer.length < 44 || buffer.length > MAX_AUDIO_BYTES || buffer.toString('ascii', 0, 4) !== 'RIFF'
    || buffer.toString('ascii', 8, 12) !== 'WAVE') throw unavailable();
  const advertised = buffer.readUInt32LE(4);
  const streaming = advertised === 0xffffffff || advertised === 0;
  const end = streaming ? buffer.length : advertised + 8;
  if (end !== buffer.length || end < 44) throw unavailable();
  let rate = 0, channels = 0, byteRate = 0, blockAlign = 0, dataBytes = 0;
  const dataChunks: WavInfo['dataChunks'] = [];
  for (let offset = 12; offset < end;) {
    if (offset + 8 > end) throw unavailable();
    const kind = buffer.toString('ascii', offset, offset + 4);
    const declared = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const unknownSize = declared === 0xffffffff || kind === 'data' && declared === 0 && streaming;
    if (unknownSize && kind !== 'data') throw unavailable();
    const size = unknownSize ? end - start : declared;
    if (size > end - start) throw unavailable();
    if (kind === 'fmt ') {
      if (size < 16 || byteRate) throw unavailable();
      let format = buffer.readUInt16LE(start);
      channels = buffer.readUInt16LE(start + 2);
      rate = buffer.readUInt32LE(start + 4);
      byteRate = buffer.readUInt32LE(start + 8);
      blockAlign = buffer.readUInt16LE(start + 12);
      const bits = buffer.readUInt16LE(start + 14);
      if (format === 65534 && size >= 40) format = buffer.readUInt16LE(start + 24);
      if (![1, 3].includes(format) || ![1, 2].includes(channels) || rate < 8000 || rate > 96000
        || ![16, 24, 32].includes(bits) || format === 3 && bits !== 32
        || blockAlign !== channels * bits / 8 || byteRate !== rate * blockAlign) throw unavailable();
    } else if (kind === 'data') {
      if (!byteRate) throw unavailable();
      dataBytes += size;
      dataChunks.push({ header: offset, bytes: size });
    }
    offset = start + size + (size % 2);
    if (offset > end) throw unavailable();
  }
  if (!byteRate || !dataBytes || !dataChunks.length || dataChunks.some(chunk => chunk.bytes % blockAlign !== 0)) throw unavailable();
  const durationMs = Math.ceil(dataBytes / byteRate * 1000);
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > MAX_DURATION_MS) throw unavailable();
  return { durationMs, sampleRate: rate, channels, dataBytes, dataChunks };
}

/** Browsers can seek a complete WAV once its streaming headers are finalized. */
export function normalizeSketchNarrationWav(bytes: Uint8Array): { audio: Buffer; durationMs: number } {
  const info = inspectSketchNarrationWav(bytes);
  const audio = Buffer.from(bytes);
  audio.writeUInt32LE(audio.length - 8, 4);
  for (const chunk of info.dataChunks) audio.writeUInt32LE(chunk.bytes, chunk.header + 4);
  return { audio, durationMs: info.durationMs };
}

type ServiceOptions = {
  /** Dependency injection for offline tests; these options are never request input. */
  directories?: string[];
  apiKey?: () => string | undefined;
  fetcher?: typeof fetch;
  now?: () => number;
  speechTimeoutMs?: number;
  filmTimeoutMs?: number;
};
type Clip = { audio: Buffer; durationMs: number };
type GateWaiter = { resolve: () => void; reject: () => void; signal: AbortSignal; abort: () => void };

export function createSketchNarrationService(options: ServiceOptions = {}) {
  const directories = options.directories || [join(process.cwd(), '.runtime', 'sketch-narration'), join(tmpdir(), `academy-sketch-narration-${hash(process.cwd()).slice(0, 16)}`)];
  const apiKey = options.apiKey || (() => process.env.OPENAI_API_KEY?.trim());
  const fetcher = options.fetcher || fetch;
  const now = options.now || Date.now;
  const speechTimeoutMs = Math.max(1, Math.min(options.speechTimeoutMs || 90_000, 90_000));
  const filmTimeoutMs = Math.max(1, Math.min(options.filmTimeoutMs || 260_000, 260_000));
  const films = new Map<string, Promise<NarratedSketchManifest>>();
  const clips = new Map<string, Promise<Clip>>();
  const starts: number[] = [];
  const clients = new Map<string, number[]>();
  const gate: GateWaiter[] = [];
  let activeFilms = 0, activeSpeech = 0;
  let writable: Promise<string> | undefined;

  async function writableDirectory() {
    if (!writable) writable = (async () => {
      for (const directory of directories) {
        const probe = join(directory, `.write-${randomUUID()}`);
        try {
          await mkdir(directory, { recursive: true });
          await writeFile(probe, '', { flag: 'wx', mode: 0o600 });
          await unlink(probe);
          return directory;
        } catch { await unlink(probe).catch(() => undefined); }
      }
      throw unavailable();
    })().catch(error => { writable = undefined; throw error; });
    return writable;
  }
  async function atomicWrite(directory: string, filename: string, value: Buffer | string) {
    const temporary = join(directory, `.${filename}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, value, { flag: 'wx', mode: 0o600 });
      await rename(temporary, join(directory, filename));
    } catch { throw unavailable(); }
    finally { await unlink(temporary).catch(() => undefined); }
  }
  async function readClip(id: string): Promise<Clip | null> {
    if (!HASH.test(id)) return null;
    for (const directory of directories) {
      try {
        const file = join(directory, `${id}.wav`);
        const metadata = await lstat(file);
        if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > MAX_AUDIO_BYTES) continue;
        const audio = await readFile(file);
        const info = inspectSketchNarrationWav(audio);
        // Complete cached streaming WAVs also receive seekable response headers.
        audio.writeUInt32LE(audio.length - 8, 4);
        for (const chunk of info.dataChunks) audio.writeUInt32LE(chunk.bytes, chunk.header + 4);
        return { audio, durationMs: info.durationMs };
      } catch { /* An absent or incomplete clip can be regenerated on POST. */ }
    }
    return null;
  }
  function identity(resolved: ReturnType<typeof resolveSketchNarrationLesson>) {
    const chapters = resolved.storyboard.chapters.map(chapter => ({ chapter, id: sketchNarrationClipId(chapter.narration) }));
    const id = hash(JSON.stringify({ version: VERSION, courseId: resolved.courseId, lessonId: resolved.lessonId, chapters: chapters.map(item => item.id) }));
    return { id, chapters };
  }
  function manifest(resolved: ReturnType<typeof resolveSketchNarrationLesson>, id: string, chapterClips: Clip[]): NarratedSketchManifest {
    const film: NarratedSketchManifest = { id, courseId: resolved.courseId, lessonId: resolved.lessonId, generated: true, chapters: resolved.storyboard.chapters.map((chapter, index) => ({ id: chapter.id, url: `/api/learning/narration/audio/${sketchNarrationClipId(chapter.narration)}`, durationMs: chapterClips[index].durationMs })) };
    const framedDurationMs = film.chapters.reduce((total, chapter) => total + Math.ceil((chapter.durationMs + SKETCH_NARRATION_LEAD_MS + SKETCH_NARRATION_TRAIL_MS) * resolved.storyboard.fps / 1000) / resolved.storyboard.fps * 1000, 0);
    if (!isNarratedSketchManifest(film, resolved.courseId, resolved.lessonId) || framedDurationMs > 15 * 60_000) throw unavailable();
    return film;
  }
  async function cached(resolved: ReturnType<typeof resolveSketchNarrationLesson>): Promise<NarratedSketchManifest | null> {
    const { id, chapters } = identity(resolved);
    const found = await Promise.all(chapters.map(chapter => readClip(chapter.id)));
    if (!found.every((clip): clip is Clip => Boolean(clip))) return null;
    try { return manifest(resolved, id, found); }
    catch { return null; }
  }
  function releaseSpeech() {
    activeSpeech--;
    while (gate.length) {
      const waiting = gate.shift()!;
      waiting.signal.removeEventListener('abort', waiting.abort);
      if (waiting.signal.aborted) { waiting.reject(); continue; }
      activeSpeech++;
      waiting.resolve();
      break;
    }
  }
  async function acquireSpeech(signal: AbortSignal) {
    if (signal.aborted) throw unavailable();
    if (activeSpeech < 2) { activeSpeech++; return; }
    await new Promise<void>((resolve, reject) => {
      const waiting: GateWaiter = { resolve, reject: () => reject(unavailable()), signal, abort: () => {
        const index = gate.indexOf(waiting);
        if (index >= 0) gate.splice(index, 1);
        reject(unavailable());
      } };
      gate.push(waiting);
      signal.addEventListener('abort', waiting.abort, { once: true });
    });
  }
  async function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
    let abort: (() => void) | undefined;
    try {
      return await new Promise<T>((resolve, reject) => {
        abort = () => reject(unavailable());
        operation.then(resolve, reject);
        if (signal.aborted) abort();
        else signal.addEventListener('abort', abort, { once: true });
      });
    } finally { if (abort) signal.removeEventListener('abort', abort); }
  }
  async function boundedAudio(response: Response, signal: AbortSignal): Promise<Buffer> {
    const declared = Number(response.headers.get('content-length'));
    if (declared > MAX_AUDIO_BYTES || !response.body) {
      void response.body?.cancel().catch(() => undefined);
      throw unavailable();
    }
    const reader = response.body.getReader();
    const abort = () => { void reader.cancel().catch(() => undefined); };
    signal.addEventListener('abort', abort, { once: true });
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        if (signal.aborted) throw unavailable();
        const next = await abortable(reader.read(), signal);
        if (next.done) break;
        length += next.value.byteLength;
        if (length > MAX_AUDIO_BYTES) { void reader.cancel().catch(() => undefined); throw unavailable(); }
        chunks.push(next.value);
      }
      if (signal.aborted) throw unavailable();
    } finally { signal.removeEventListener('abort', abort); reader.releaseLock(); }
    return Buffer.concat(chunks, length);
  }
  async function generateClip(id: string, narration: string, key: string, signal: AbortSignal): Promise<Clip> {
    const ready = await readClip(id);
    if (ready) return ready;
    const existing = clips.get(id);
    if (existing) return existing;
    const job = (async () => {
      await acquireSpeech(signal);
      const timeout = new AbortController();
      const abort = () => timeout.abort();
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) timeout.abort();
      const timer = setTimeout(abort, speechTimeoutMs);
      try {
        const speech = fetcher('https://api.openai.com/v1/audio/speech', {
          method: 'POST', signal: timeout.signal,
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: MODEL, voice: VOICE, input: narration, instructions: INSTRUCTIONS, response_format: 'wav' }),
        });
        void speech.then(response => { if (timeout.signal.aborted) void response.body?.cancel().catch(() => undefined); }).catch(() => undefined);
        const response = await abortable(speech, timeout.signal);
        if (!response.ok) { void response.body?.cancel().catch(() => undefined); throw unavailable(); }
        const clip = normalizeSketchNarrationWav(await boundedAudio(response, timeout.signal));
        await atomicWrite(await writableDirectory(), `${id}.wav`, clip.audio);
        return clip;
      } catch { throw unavailable(); }
      finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        releaseSpeech();
      }
    })();
    clips.set(id, job);
    try { return await job; }
    finally { if (clips.get(id) === job) clips.delete(id); }
  }
  function permit(client: string) {
    const time = now(), window = 10 * 60_000;
    while (starts.length && starts[0] <= time - window) starts.shift();
    const clientHash = hash(client.slice(0, 256));
    const recent = (clients.get(clientHash) || []).filter(timestamp => timestamp > time - window);
    if (starts.length >= 12 || recent.length >= 4) throw new SketchNarrationError(429, 'The lesson voice is busy. Please try again shortly.', 60);
    starts.push(time); recent.push(time); clients.set(clientHash, recent);
    if (clients.size > 256) clients.delete(clients.keys().next().value!);
  }
  return {
    async getStatus(courseId: unknown, lessonId: unknown) {
      const resolved = resolveSketchNarrationLesson(courseId, lessonId);
      const ready = await cached(resolved);
      return ready ? { ready: true as const, manifest: ready } : { ready: false as const, available: Boolean(apiKey()) };
    },
    async generate(courseId: unknown, lessonId: unknown, client = 'local'): Promise<NarratedSketchManifest> {
      const resolved = resolveSketchNarrationLesson(courseId, lessonId);
      const { id, chapters } = identity(resolved);
      const existing = films.get(id);
      if (existing) return existing;
      const ready = await cached(resolved);
      if (ready) return ready;
      const shared = films.get(id);
      if (shared) return shared;
      const key = apiKey();
      if (!key) throw new SketchNarrationError(503, 'The lesson voice is unavailable right now.');
      if (activeFilms >= 2) throw new SketchNarrationError(429, 'The lesson voice is busy. Please try again shortly.', 15);
      permit(client);
      activeFilms++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), filmTimeoutMs);
      const job = (async () => {
        try {
          const generated: Clip[] = new Array(chapters.length);
          let cursor = 0;
          await Promise.all(Array.from({ length: 2 }, async () => {
            while (cursor < chapters.length) {
              const index = cursor++;
              const item = chapters[index];
              generated[index] = await generateClip(item.id, item.chapter.narration, key, controller.signal);
            }
          }));
          const film = manifest(resolved, id, generated);
          await atomicWrite(await writableDirectory(), `${id}.json`, JSON.stringify(film));
          return film;
        } catch { controller.abort(); throw unavailable(); }
        finally { clearTimeout(timer); activeFilms--; }
      })();
      films.set(id, job);
      try { return await job; }
      finally { if (films.get(id) === job) films.delete(id); }
    },
    async readAudio(id: string): Promise<Buffer | null> {
      if (!HASH.test(id)) return null;
      return (await readClip(id))?.audio || null;
    },
  };
}

type NarrationService = ReturnType<typeof createSketchNarrationService>;
const processServices = globalThis as typeof globalThis & { __academySketchNarration?: NarrationService };
export const sketchNarrationService = processServices.__academySketchNarration || (processServices.__academySketchNarration = createSketchNarrationService());
