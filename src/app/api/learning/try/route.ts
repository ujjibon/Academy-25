import { NextRequest, NextResponse } from 'next/server';
import { LessonTryError, lessonTryService } from '@/lib/lesson-try-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'no-store' };

async function boundedBody(request: NextRequest) {
  if (!request.body || Number(request.headers.get('content-length')) > 8000) throw new LessonTryError(400, 'This prompt is too long. Keep it under 1,800 characters.');
  const reader = request.body.getReader();
  const pieces: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 8000) { await reader.cancel(); throw new Error('Oversized'); }
      pieces.push(part.value);
    }
    return JSON.parse(Buffer.concat(pieces, bytes).toString('utf8'));
  } catch { throw new LessonTryError(400, 'Write a short prompt and try again.'); }
  finally { reader.releaseLock(); }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  let sameOrigin = true;
  if (origin) {
    try { const expected = new URL(request.url); expected.host = request.headers.get('host') || expected.host; sameOrigin = origin === expected.origin; }
    catch { sameOrigin = false; }
  }
  if (!sameOrigin || request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ error: 'Try your prompt from its lesson.' }, { status: 403, headers });
  try {
    const input = await boundedBody(request);
    const client = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
    return NextResponse.json(await lessonTryService.tryPrompt(input, client, request.signal), { headers });
  } catch (error) {
    if (error instanceof LessonTryError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { ...headers, ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) } });
    return NextResponse.json({ error: 'Your prompt could not be tried right now. Keep your edit and try again.' }, { status: 503, headers });
  }
}
