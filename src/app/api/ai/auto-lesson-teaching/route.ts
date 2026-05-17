import { NextRequest, NextResponse } from 'next/server';
import { autoLessonTeaching } from '@/ai/flows/auto-lesson-teaching-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await autoLessonTeaching(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in auto lesson teaching:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate auto lesson teaching';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
