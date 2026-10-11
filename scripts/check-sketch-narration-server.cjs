// Exercise the server and HTTP routes with real WAV bytes and injected local
// providers. This script never calls the speech API or reads an account key.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const runtimeRoot = path.join(root, '.runtime');
fs.mkdirSync(runtimeRoot, { recursive: true });
const testRoot = fs.mkdtempSync(path.join(runtimeRoot, 'narration-server-check-'));
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolveFilename.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const server = require('../src/lib/sketch-narration-server.ts');
const { isNarratedSketchManifest, applySketchNarration } = require('../src/lib/narrated-sketch.ts');
const { NextRequest } = require('next/server');
const audioRoute = require('../src/app/api/learning/narration/audio/[id]/route.ts');
const narrationRoute = require('../src/app/api/learning/narration/route.ts');
const { SketchNarrationError, resolveSketchNarrationLesson, sketchNarrationClipId, inspectSketchNarrationWav, normalizeSketchNarrationWav, createSketchNarrationService, sketchAudioRange } = server;
const savedService = server.sketchNarrationService;
const realSetTimeout = global.setTimeout;
const delay = ms => new Promise(resolve => realSetTimeout(resolve, ms));
const FAKE_KEY = 'offline-test-key-do-not-log';
const logs = [];
const originalConsole = { log: console.log, warn: console.warn, error: console.error };
let wavChecks = 0, serviceChecks = 0, routeChecks = 0;
function chunk(kind, data, declared = data.length, padding = true) {
  const header = Buffer.alloc(8); header.write(kind, 0, 'ascii'); header.writeUInt32LE(declared, 4);
  return Buffer.concat([header, data, ...(padding && data.length % 2 ? [Buffer.alloc(1)] : [])]);
}
function wav({ rate = 24000, channels = 1, bits = 16, format = 1, samples = rate, extras = [], dataParts, riffSentinel, dataSentinel, padData = true } = {}) {
  const formatBytes = Buffer.alloc(16);
  formatBytes.writeUInt16LE(format, 0); formatBytes.writeUInt16LE(channels, 2);
  formatBytes.writeUInt32LE(rate, 4); formatBytes.writeUInt32LE(rate * channels * bits / 8, 8);
  formatBytes.writeUInt16LE(channels * bits / 8, 12); formatBytes.writeUInt16LE(bits, 14);
  const parts = dataParts || [Buffer.alloc(samples * channels * bits / 8)];
  const body = Buffer.concat([Buffer.from('WAVE'), chunk('fmt ', formatBytes), ...extras, ...parts.map(data => chunk('data', data, dataSentinel === undefined ? data.length : dataSentinel, padData))]);
  const header = Buffer.alloc(8); header.write('RIFF'); header.writeUInt32LE(riffSentinel === undefined ? body.length : riffSentinel, 4);
  return Buffer.concat([header, body]);
}
function expectWavRejected(bytes, reason) {
  assert.throws(() => inspectSketchNarrationWav(bytes), error => error instanceof SketchNarrationError && error.status === 503, reason);
  wavChecks++;
}
async function expectFailure(operation, status = 503) {
  let failure;
  try { await operation(); } catch (error) { failure = error; }
  assert(failure instanceof SketchNarrationError, 'A service failure is a bounded domain error');
  assert.equal(failure.status, status);
  assert(failure.message.length < 160 && !failure.message.includes(FAKE_KEY) && !failure.message.includes('private-provider-detail'), 'A provider failure never leaks its body or credentials');
  serviceChecks++;
  return failure;
}
function directory(name) { return path.join(testRoot, name); }
function service(name, fetcher, extra = {}) {
  return createSketchNarrationService({ directories: [directory(name)], apiKey: () => FAKE_KEY, fetcher, ...extra });
}
function successfulProvider(delayMs = 0) {
  const state = { calls: [], active: 0, peak: 0 };
  state.fetcher = async (url, options) => {
    state.calls.push({ url, options }); state.active++; state.peak = Math.max(state.peak, state.active);
    try { if (delayMs) await delay(delayMs); return new Response(wav({ riffSentinel: 0xffffffff, dataSentinel: 0xffffffff }), { headers: { 'Content-Type': 'audio/wav' } }); }
    finally { state.active--; }
  };
  return state;
}
async function requestAudio(id, headers = {}, head = false) {
  const request = new NextRequest(`http://localhost/api/learning/narration/audio/${id}`, { headers });
  return (head ? audioRoute.HEAD : audioRoute.GET)(request, { params: Promise.resolve({ id }) });
}
async function requestManifest(input, headers = {}, method = 'POST') {
  const request = new NextRequest('http://localhost/api/learning/narration', { method, headers, ...(method === 'POST' ? { body: typeof input === 'string' ? input : JSON.stringify(input) } : {}) });
  return narrationRoute[method](request);
}
async function main() {
  // Independent PCM geometry: streaming RIFF/data sizes, multiple chunks, odd
  // metadata padding, stereo, and 24-bit sample frames all have actual durations.
  for (const bytes of [wav(), wav({ riffSentinel: 0xffffffff, dataSentinel: 0xffffffff }), wav({ riffSentinel: 0, dataSentinel: 0 }), wav({ extras: [chunk('JUNK', Buffer.from([1, 2, 3]))] })]) {
    const before = Buffer.from(bytes), parsed = inspectSketchNarrationWav(bytes);
    assert.equal(parsed.durationMs, 1000); assert.equal(parsed.sampleRate, 24000); assert.equal(parsed.channels, 1);
    const normalized = normalizeSketchNarrationWav(bytes);
    assert.deepEqual(bytes, before, 'Normalization never mutates the provider bytes');
    assert.equal(normalized.audio.readUInt32LE(4), normalized.audio.length - 8);
    for (const data of parsed.dataChunks) assert.equal(normalized.audio.readUInt32LE(data.header + 4), data.bytes);
    assert.equal(inspectSketchNarrationWav(normalized.audio).durationMs, 1000); wavChecks++;
  }
  const multiple = inspectSketchNarrationWav(wav({ dataParts: [Buffer.alloc(12000), Buffer.alloc(36000)] }));
  assert.equal(multiple.dataChunks.length, 2); assert.equal(multiple.durationMs, 1000); wavChecks++;
  const stereo = inspectSketchNarrationWav(wav({ rate: 16000, channels: 2, samples: 32000 }));
  assert.equal(stereo.channels, 2); assert.equal(stereo.durationMs, 2000); wavChecks++;
  assert.equal(inspectSketchNarrationWav(wav({ format: 3, bits: 32 })).durationMs, 1000); wavChecks++;
  const odd24 = wav({ rate: 8000, bits: 24, samples: 8001 });
  assert.equal(inspectSketchNarrationWav(odd24).durationMs, 1001); wavChecks++;
  const offsetBytes = Buffer.concat([Buffer.alloc(7), wav(), Buffer.alloc(5)]);
  assert.equal(inspectSketchNarrationWav(new Uint8Array(offsetBytes.buffer, offsetBytes.byteOffset + 7, offsetBytes.length - 12)).durationMs, 1000, 'Typed-array view offsets are respected'); wavChecks++;
  const good = wav();
  expectWavRejected(good.subarray(0, good.length - 1), 'An advertised data body cannot be truncated');
  expectWavRejected(wav({ rate: 8000, bits: 24, samples: 8001, padData: false }), 'An odd final chunk requires its pad byte');
  const dangling = Buffer.concat([good, Buffer.from('JUNK')]); dangling.writeUInt32LE(dangling.length - 8, 4);
  expectWavRejected(dangling, 'An incomplete chunk header is not ignored');
  expectWavRejected(Buffer.concat([good, Buffer.from('JUNK')]), 'Bytes outside the advertised RIFF container are rejected');
  expectWavRejected(wav({ extras: [chunk('fmt ', good.subarray(20, 36))] }), 'Duplicate format chunks are ambiguous');
  const invalidRiff = Buffer.from(good); invalidRiff.write('RIFX'); expectWavRejected(invalidRiff, 'Only supported RIFF WAV bytes are accepted');
  const invalidAlign = Buffer.from(good); invalidAlign.writeUInt16LE(3, 32); expectWavRejected(invalidAlign, 'Invalid block alignment is rejected');
  const invalidRate = Buffer.from(good); invalidRate.writeUInt32LE(1, 28); expectWavRejected(invalidRate, 'Inconsistent byte rate is rejected');
  const malformedFmt = Buffer.from(good); malformedFmt.writeUInt32LE(8, 16); expectWavRejected(malformedFmt, 'A short format chunk is rejected');
  expectWavRejected(wav({ bits: 8 }), 'Unsupported sample bits are rejected');
  expectWavRejected(wav({ format: 2 }), 'Compressed/unknown formats are rejected');
  expectWavRejected(wav({ samples: 1 }), 'A tiny incomplete speech result is rejected');
  expectWavRejected(wav({ rate: 8000, samples: 8000 * 181 }), 'An overlong chapter is rejected');
  const unaligned = wav({ dataParts: [Buffer.alloc(24001)] }); expectWavRejected(unaligned, 'Data must contain complete sample frames');

  // Exercise the real catalog resolver, not a fake course object.
  const courses = fs.readdirSync(path.join(root, 'src/data/courses')).filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(fs.readFileSync(path.join(root, 'src/data/courses', file), 'utf8'))).filter(course => Array.isArray(course.lessons));
  let resolved = 0;
  for (const course of courses) for (const lesson of course.lessons) {
    const result = resolveSketchNarrationLesson(course.id, Number(lesson.id));
    assert.equal(result.courseId, course.id); assert.equal(result.lessonId, Number(lesson.id));
    assert.equal(result.storyboard.id, `${course.id}:${lesson.id}`); assert.equal(result.storyboard.chapters.length, 5); resolved++;
  }
  assert.equal(resolved, 84);
  for (const [courseId, lessonId, status] of [
    ['../private', 1, 400], ['masters-codex', '1', 400], ['masters-codex', 0, 400], ['masters-codex', 1.5, 400],
    ['masters-codex', NaN, 400], ['masters-codex', 10000, 400], ['missing-course', 1, 404], ['masters-codex', 9999, 404],
    ['__proto__', 1, 400], ['Python-SP-101', 1, null],
  ]) {
    if (status) assert.throws(() => resolveSketchNarrationLesson(courseId, lessonId), error => error instanceof SketchNarrationError && error.status === status);
    else assert.equal(resolveSketchNarrationLesson(courseId, lessonId).courseId, courseId);
    serviceChecks++;
  }
  assert.equal(sketchNarrationClipId('Exact words'), sketchNarrationClipId('Exact words'));
  assert.notEqual(sketchNarrationClipId('Exact words'), sketchNarrationClipId('Changed words'));
  assert(/^[a-f0-9]{64}$/.test(sketchNarrationClipId('Exact words')));

  // Catch any accidental logging while injected credentials are in scope.
  for (const method of Object.keys(originalConsole)) console[method] = (...args) => logs.push(args.map(String).join(' '));
  const provider = successfulProvider(5);
  const cachedService = service('cache', provider.fetcher);
  assert.deepEqual(await cachedService.getStatus('masters-codex', 1), { ready: false, available: true });
  assert.equal(provider.calls.length, 0, 'A status check never pays for narration');
  const manifests = await Promise.all(Array.from({ length: 12 }, () => cachedService.generate('masters-codex', 1, 'offline-player')));
  const manifest = manifests[0];
  assert(manifests.every(item => JSON.stringify(item) === JSON.stringify(manifest)), 'Concurrent requests share one completed film');
  assert.equal(provider.calls.length, 5, 'Single-flight generates at most the five authored clips');
  assert(provider.peak <= 2, 'Speech concurrency stays bounded');
  assert(isNarratedSketchManifest(manifest, 'masters-codex', 1));
  assert.equal(applySketchNarration(resolveSketchNarrationLesson('masters-codex', 1).storyboard, manifest).chapters.length, 5);
  for (const { url, options } of provider.calls) {
    assert.equal(url, 'https://api.openai.com/v1/audio/speech'); assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, `Bearer ${FAKE_KEY}`);
    const body = JSON.parse(options.body); assert.equal(body.response_format, 'wav');
    assert(body.input.length > 20 && !options.body.includes(FAKE_KEY), 'Credentials travel only in the authorization header');
    assert(resolveSketchNarrationLesson('masters-codex', 1).storyboard.chapters.some(chapter => chapter.narration === body.input), 'Only canonical authored narration reaches the provider');
  }
  assert.equal((await cachedService.getStatus('masters-codex', 1)).ready, true);
  await cachedService.generate('masters-codex', 1); assert.equal(provider.calls.length, 5, 'Memory/disk cache hits make no provider calls');
  const persisted = service('cache', () => { throw new Error('A persisted cache must not call a provider'); }, { apiKey: () => undefined });
  assert.equal((await persisted.getStatus('masters-codex', 1)).ready, true);
  assert.deepEqual(await persisted.generate('masters-codex', 1), manifest, 'Cached playback works with no key');
  const clipId = manifest.chapters[0].url.split('/').at(-1);
  const audio = await persisted.readAudio(clipId); assert(audio instanceof Buffer);
  assert.equal(audio.readUInt32LE(4), audio.length - 8, 'Cached streaming WAV headers are finalized');
  assert.equal(await persisted.readAudio('../private'), null); assert.equal(await persisted.readAudio('a'.repeat(63)), null);
  serviceChecks += 12;

  // A corrupt clip cannot masquerade as a cache hit; only that clip is redone.
  fs.writeFileSync(path.join(directory('cache'), `${clipId}.wav`), Buffer.from('truncated'));
  const repairingProvider = successfulProvider();
  const repairing = service('cache', repairingProvider.fetcher);
  assert.equal((await repairing.getStatus('masters-codex', 1)).ready, false);
  assert.deepEqual(await repairing.generate('masters-codex', 1), manifest);
  assert.equal(repairingProvider.calls.length, 1, 'A single corrupt clip does not regenerate the entire lesson'); serviceChecks++;

  let partialCalls = 0;
  const partial = service('partial', async () => {
    partialCalls++; const count = partialCalls; await delay(4);
    if (count === 3) return new Response(`private-provider-detail ${FAKE_KEY}`, { status: 500 });
    return new Response(wav());
  });
  await expectFailure(() => partial.generate('masters-codex', 1));
  await delay(30);
  const finishedClips = fs.readdirSync(directory('partial')).filter(file => /^[a-f0-9]{64}\.wav$/.test(file)).length;
  assert(finishedClips > 0 && finishedClips < 5, 'Successful clips survive a partial provider failure');
  const retryProvider = successfulProvider();
  const retry = service('partial', retryProvider.fetcher);
  assert(isNarratedSketchManifest(await retry.generate('masters-codex', 1), 'masters-codex', 1));
  assert.equal(retryProvider.calls.length, 5 - finishedClips, 'A retry only requests missing clips'); serviceChecks++;

  const noKey = service('no-key', () => { throw new Error('No-key service must not request speech'); }, { apiKey: () => undefined });
  assert.deepEqual(await noKey.getStatus('masters-codex', 1), { ready: false, available: false });
  await expectFailure(() => noKey.generate('masters-codex', 1));
  const providerFailure = service('provider-failure', async () => { throw new Error(`private-provider-detail ${FAKE_KEY}`); });
  await expectFailure(() => providerFailure.generate('masters-codex', 1));
  const malformedAudio = service('malformed-audio', async () => new Response('not a WAV'));
  await expectFailure(() => malformedAudio.generate('masters-codex', 1));
  const shortSpeech = service('short-speech', async () => new Response(wav({ samples: 2400 })));
  await expectFailure(() => shortSpeech.generate('masters-codex', 1));
  const tooLongFilm = service('too-long-film', async () => new Response(wav({ rate: 8000, samples: 8000 * 180 })));
  await expectFailure(() => tooLongFilm.generate('masters-codex', 1));
  assert.equal((await tooLongFilm.getStatus('masters-codex', 1)).ready, false, 'A padded film over fifteen minutes cannot become a ready cache hit'); serviceChecks++;
  const declaredOversize = service('declared-oversize', async () => new Response(wav(), { headers: { 'content-length': String(12 * 1024 * 1024 + 1) } }));
  await expectFailure(() => declaredOversize.generate('masters-codex', 1));

  // Trigger actual abort handlers through factory-only deadline injection.
  // Even a provider that ignores its signal must not defeat the deadline.
  const abortingProvider = async (_, options) => new Promise((resolve, reject) => {
    if (options.signal.aborted) reject(new Error('aborted'));
    else options.signal.addEventListener('abort', () => reject(new Error(`private-provider-detail ${FAKE_KEY}`)), { once: true });
  });
  for (const deadline of ['speech', 'film']) {
    const options = deadline === 'speech' ? { speechTimeoutMs: 5, filmTimeoutMs: 100 } : { speechTimeoutMs: 100, filmTimeoutMs: 5 };
    for (const [behavior, fetcher] of [['honors-signal', abortingProvider], ['ignores-signal', () => new Promise(() => {})]]) {
      const timed = service(`timeout-${deadline}-${behavior}`, fetcher, options);
      const started = Date.now(); await expectFailure(() => timed.generate('masters-codex', 1));
      assert(Date.now() - started < 1000, 'Provider and film deadlines produce bounded failures');
    }
  }
  let lateCancellation = 0;
  const lateProvider = service('late-provider', async () => {
    await delay(30);
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(wav()); }, cancel() { lateCancellation++; } }));
  }, { speechTimeoutMs: 5, filmTimeoutMs: 100 });
  await expectFailure(() => lateProvider.generate('masters-codex', 1)); await delay(50);
  assert(lateCancellation > 0, 'A late provider response is cancelled after the caller times out');
  let stalledCancellation = 0;
  const stalledBody = service('stalled-body', async () => new Response(new ReadableStream({
    pull() { return new Promise(() => {}); }, cancel() { stalledCancellation++; return new Promise(() => {}); },
  })), { speechTimeoutMs: 5, filmTimeoutMs: 100 });
  await expectFailure(() => stalledBody.generate('masters-codex', 1));
  assert(stalledCancellation > 0, 'A stalled audio stream is cancelled without waiting on provider cleanup');
  let cancelled = 0;
  const oversized = service('oversized', async () => {
    let sent = 0;
    return new Response(new ReadableStream({ pull(controller) { if (sent++ < 14) controller.enqueue(new Uint8Array(1024 * 1024)); else controller.close(); }, cancel() { cancelled++; } }));
  });
  await expectFailure(() => oversized.generate('masters-codex', 1));
  assert(cancelled > 0, 'An oversized streamed body is cancelled');

  let clock = 1000000, limitedCalls = 0;
  const limited = service('rate-limit', async () => { limitedCalls++; return new Response('busy', { status: 503 }); }, { now: () => clock });
  for (let attempt = 0; attempt < 4; attempt++) { await expectFailure(() => limited.generate('masters-codex', 1, 'same-player')); await delay(2); }
  const beforeLimit = limitedCalls;
  const busy = await expectFailure(() => limited.generate('masters-codex', 1, 'same-player'), 429);
  assert.equal(busy.retryAfter, 60); assert.equal(limitedCalls, beforeLimit, 'Rate-limited work never reaches the provider');
  clock += 600001; await expectFailure(() => limited.generate('masters-codex', 1, 'same-player'));

  const concurrentProvider = successfulProvider(30), concurrentFilms = service('concurrent-films', concurrentProvider.fetcher);
  const firstTwo = [concurrentFilms.generate('masters-codex', 1), concurrentFilms.generate('masters-codex', 2)];
  await delay(10);
  await expectFailure(() => concurrentFilms.generate('masters-codex', 3), 429);
  assert.equal((await Promise.all(firstTwo)).length, 2); assert(concurrentProvider.peak <= 2, 'Different films share the speech concurrency gate'); serviceChecks++;

  // Exercise the actual public byte-range and response handlers against a
  // persisted recording. The singleton is replaced only in this process.
  server.sketchNarrationService = repairing;
  for (const [range, expected] of [
    ['bytes=0-9', { start: 0, end: 9 }], ['bytes=90-', { start: 90, end: 99 }], ['bytes=-10', { start: 90, end: 99 }],
    ['bytes=-200', { start: 0, end: 99 }], ['bytes=99-1000', { start: 99, end: 99 }],
  ]) { assert.deepEqual(sketchAudioRange(range, 100), expected); routeChecks++; }
  for (const range of ['bytes=', 'bytes=-', 'bytes=-0', 'bytes=100-', 'bytes=5-4', 'bytes=0-1,3-4', 'items=0-5', 'bytes=9007199254740992-', 'bytes=-9007199254740992']) {
    assert.equal(sketchAudioRange(range, 100), null); routeChecks++;
  }
  assert.equal(sketchAudioRange('bytes=-10', 0), null); routeChecks++;
  const full = await requestAudio(clipId);
  assert.equal(full.status, 200); assert.equal(full.headers.get('content-type'), 'audio/wav');
  assert.equal(full.headers.get('accept-ranges'), 'bytes'); assert.equal(Number(full.headers.get('content-length')), audio.length);
  assert.equal(full.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), audio); routeChecks++;
  const ranged = await requestAudio(clipId, { range: 'bytes=0-15' });
  assert.equal(ranged.status, 206); assert.equal(ranged.headers.get('content-range'), `bytes 0-15/${audio.length}`);
  assert.deepEqual(Buffer.from(await ranged.arrayBuffer()), audio.subarray(0, 16)); routeChecks++;
  const suffix = await requestAudio(clipId, { range: 'bytes=-10' });
  assert.equal(suffix.status, 206); assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), audio.subarray(-10)); routeChecks++;
  const head = await requestAudio(clipId, { range: 'bytes=0-15' }, true);
  assert.equal(head.status, 206); assert.equal(head.headers.get('content-length'), '16'); assert.equal((await head.arrayBuffer()).byteLength, 0); routeChecks++;
  assert.equal((await requestAudio(clipId, { 'if-none-match': `"${clipId}"` })).status, 304); routeChecks++;
  assert.equal((await requestAudio(clipId, { range: 'bytes=0-15', 'if-range': '"different"' })).status, 200); routeChecks++;
  const unsatisfiable = await requestAudio(clipId, { range: 'bytes=999999999-' });
  assert.equal(unsatisfiable.status, 416); assert.equal(unsatisfiable.headers.get('content-range'), `bytes */${audio.length}`); routeChecks++;
  assert.equal((await requestAudio('../private')).status, 404); assert.equal((await requestAudio('f'.repeat(64))).status, 404); routeChecks += 2;

  const post = await requestManifest({ courseId: 'masters-codex', lessonId: 1 });
  assert.equal(post.status, 200); assert.equal(post.headers.get('cache-control'), 'no-store');
  assert(isNarratedSketchManifest(await post.json(), 'masters-codex', 1)); routeChecks++;
  for (const [headers, expected] of [
    [{ origin: 'http://localhost' }, 200],
    [{ origin: 'http://127.0.0.1:3019', host: '127.0.0.1:3019' }, 200],
    [{ origin: 'http://localhost:3019', host: 'localhost:3019' }, 200],
    [{ origin: 'http://localhost:3019', host: '127.0.0.1:3019' }, 403],
    [{ origin: 'https://another-origin.example', host: '127.0.0.1:3019', 'x-forwarded-host': 'another-origin.example' }, 403],
    [{ origin: 'null', host: 'localhost' }, 403],
  ]) {
    assert.equal((await requestManifest({ courseId: 'masters-codex', lessonId: 1 }, headers)).status, expected, 'Browser origin uses the actual host');
    routeChecks++;
  }
  for (const [input, headers, status] of [
    [{ courseId: 'masters-codex', lessonId: 1, narration: 'client-supplied speech' }, {}, 400],
    [{ courseId: 'masters-codex', lessonId: '1' }, {}, 400],
    [{ courseId: '../private', lessonId: 1 }, {}, 400],
    [{ courseId: 'missing-course', lessonId: 1 }, {}, 404],
    ['{broken-json', {}, 400], ['x'.repeat(2049), {}, 400],
    [{ courseId: 'masters-codex', lessonId: 1 }, { origin: 'https://another-origin.example' }, 403],
    [{ courseId: 'masters-codex', lessonId: 1 }, { 'sec-fetch-site': 'cross-site' }, 403],
  ]) { const response = await requestManifest(input, headers); assert.equal(response.status, status); assert(!JSON.stringify(await response.json()).includes(FAKE_KEY)); routeChecks++; }
  for (const [query, expected] of [
    ['courseId=masters-codex&lessonId=1', 200], ['courseId=masters-codex&lessonId=01', 400], ['courseId=masters-codex&lessonId=1.5', 400],
    ['courseId=masters-codex&lessonId=9999', 404], ['courseId=masters-codex', 400],
  ]) {
    const response = await narrationRoute.GET(new NextRequest(`http://localhost/api/learning/narration?${query}`));
    assert.equal(response.status, expected); if (expected === 200) assert.equal((await response.json()).ready, true); routeChecks++;
  }
  assert(logs.every(log => !log.includes(FAKE_KEY) && !log.includes('private-provider-detail')), 'Keys and raw provider errors stay out of logs');
  return `PASS: ${resolved} canonical lessons, ${wavChecks} WAV cases, ${serviceChecks} cache/provider/timeout cases, ${routeChecks} route/range cases; five calls per single-flight film, partial retries, and no credential logging.`;
}
main().then(message => { originalConsole.log(message); }).catch(error => { originalConsole.error(error); process.exitCode = 1; }).finally(() => {
  global.setTimeout = realSetTimeout; server.sketchNarrationService = savedService;
  Object.assign(console, originalConsole); Module._resolveFilename = resolveFilename;
  // Delete only this invocation's freshly created directory. Verify the final
  // absolute target is one direct child of the intended workspace runtime.
  const absolute = path.resolve(testRoot), relative = path.relative(path.resolve(runtimeRoot), absolute);
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative) && !relative.includes(path.sep) && /^narration-server-check-[A-Za-z0-9]+$/.test(relative));
  fs.rmSync(absolute, { recursive: true, force: true });
});
