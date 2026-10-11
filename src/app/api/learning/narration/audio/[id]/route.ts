import { NextRequest } from 'next/server';
import { sketchAudioRange, sketchNarrationService } from '@/lib/sketch-narration-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

async function audioResponse(request: NextRequest, context: Context, head: boolean) {
  const { id } = await context.params;
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const audio = await sketchNarrationService.readAudio(id);
    if (!audio) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const etag = `"${id}"`;
    const headers: Record<string, string> = { 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', ETag: etag };
    if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
    const rawRange = request.headers.get('range');
    const ifRange = request.headers.get('if-range');
    if (rawRange && (!ifRange || ifRange === etag)) {
      const range = sketchAudioRange(rawRange, audio.length);
      if (!range) return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${audio.length}` } });
      headers['Content-Range'] = `bytes ${range.start}-${range.end}/${audio.length}`;
      headers['Content-Length'] = String(range.end - range.start + 1);
      return new Response(head ? null : new Uint8Array(audio.subarray(range.start, range.end + 1)), { status: 206, headers });
    }
    headers['Content-Length'] = String(audio.length);
    return new Response(head ? null : new Uint8Array(audio), { status: 200, headers });
  } catch { return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}

export async function GET(request: NextRequest, context: Context) { return audioResponse(request, context, false); }
export async function HEAD(request: NextRequest, context: Context) { return audioResponse(request, context, true); }
