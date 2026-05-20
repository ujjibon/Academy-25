import { NextRequest, NextResponse } from 'next/server';
import { generateCourse } from '@/ai/flows/generate-course-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }
    const course = await generateCourse({ topic });
    return NextResponse.json(course);
  } catch (error) {
    console.error('[generate-course]', error);
    return NextResponse.json({ error: 'Course generation failed' }, { status: 500 });
  }
}
