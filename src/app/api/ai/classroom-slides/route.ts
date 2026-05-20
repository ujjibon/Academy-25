import { NextRequest, NextResponse } from 'next/server';
import { classroomSlideGenerator } from '@/ai/flows/classroom-slide-generator-flow';
import {
  getCachedLessonSlidesFromDisk,
  saveCachedLessonSlidesToDisk,
} from '@/lib/lesson-slides-storage-server';

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get('courseId');
  const lessonId = request.nextUrl.searchParams.get('lessonId');

  if (!courseId || !lessonId) {
    return NextResponse.json(
      { error: 'courseId and lessonId are required' },
      { status: 400 }
    );
  }

  const cached = await getCachedLessonSlidesFromDisk(courseId, lessonId);
  if (!cached) {
    return NextResponse.json({ cached: false }, { status: 404 });
  }

  return NextResponse.json({ ...cached, cached: true, source: 'disk' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courseId = body.courseId as string | undefined;
    const lessonId = body.lesson?.id as string | undefined;
    const forceRegenerate = Boolean(body.forceRegenerate);

    console.log('Received slide generation request:', {
      courseId,
      lessonTitle: body.lesson?.title,
      courseTitle: body.courseContext?.title,
      slideCount: body.slideCount,
      forceRegenerate,
    });

    if (courseId && lessonId && !forceRegenerate) {
      const cached = await getCachedLessonSlidesFromDisk(courseId, lessonId);
      if (cached) {
        console.log('Returning cached slides from disk:', {
          courseId,
          lessonId,
          slideCount: cached.slides.length,
        });
        return NextResponse.json({ ...cached, cached: true, source: 'disk' });
      }
    }

    const result = await classroomSlideGenerator(body);

    if (courseId && lessonId) {
      await saveCachedLessonSlidesToDisk(courseId, lessonId, result);
      console.log('Saved slides to disk cache:', { courseId, lessonId });
    }

    console.log('Successfully generated slides:', {
      slideCount: result.slides?.length,
      totalDuration: result.totalDuration,
    });

    return NextResponse.json({ ...result, cached: false, source: 'generated' });
  } catch (error) {
    console.error('Error generating classroom slides:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Failed to generate classroom slides',
        details: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
