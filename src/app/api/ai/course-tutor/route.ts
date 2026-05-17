import { NextRequest, NextResponse } from 'next/server';
import { courseTutor } from '@/ai/flows/course-tutor-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await courseTutor(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in course tutor:', error);
    return NextResponse.json(
      { error: 'Failed to get course tutor response' },
      { status: 500 }
    );
  }
}
