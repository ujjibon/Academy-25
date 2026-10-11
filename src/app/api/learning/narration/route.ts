import { NextRequest, NextResponse } from 'next/server';
import { SketchNarrationError, sketchNarrationService } from '@/lib/sketch-narration-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function failure(error: unknown) {
  if (error instanceof SketchNarrationError) return NextResponse.json({ error: error.message }, {
    status: error.status, headers: { 'Cache-Control': 'no-store', ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) },
  });
  return NextResponse.json({ error: 'The lesson voice could not be prepared. Please try again.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('lessonId');
    if (!raw || !/^[1-9]\d{0,3}$/.test(raw)) throw new SketchNarrationError(400, 'Valid course and lesson identifiers are required.');
    const status = await sketchNarrationService.getStatus(request.nextUrl.searchParams.get('courseId'), Number(raw));
    return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}

async function boundedInput(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > 2048 || !request.body) throw new SketchNarrationError(400, 'Invalid lesson voice request.');
  const reader = request.body.getReader();
  const pieces: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > 2048) { await reader.cancel(); throw new SketchNarrationError(400, 'Invalid lesson voice request.'); }
      pieces.push(next.value);
    }
    return JSON.parse(Buffer.concat(pieces, bytes).toString('utf8'));
  } catch { throw new SketchNarrationError(400, 'Invalid lesson voice request.'); }
  finally { reader.releaseLock(); }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  // Next normalizes loopback URLs to localhost. The browser's Origin must be
  // compared with its actual Host, so 127.0.0.1 previews remain same-origin.
  let sameOrigin = true;
  if (origin) {
    try {
      const expected = new URL(request.url);
      expected.host = request.headers.get('host') || expected.host;
      sameOrigin = origin === expected.origin;
    } catch { sameOrigin = false; }
  }
  if (!sameOrigin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Use the lesson player to prepare its voice.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const input = await boundedInput(request);
    if (!input || typeof input !== 'object' || Array.isArray(input)
      || Object.keys(input).some(key => key !== 'courseId' && key !== 'lessonId')) throw new SketchNarrationError(400, 'Invalid lesson voice request.');
    const fields = input as { courseId?: unknown; lessonId?: unknown };
    const client = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
    const film = await sketchNarrationService.generate(fields.courseId, fields.lessonId, client);
    return NextResponse.json(film, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
