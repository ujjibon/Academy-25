import { NextRequest, NextResponse } from 'next/server';
import { classroomSlideGenerator, ClassroomSlideGeneratorInputSchema, type ClassroomSlideGeneratorOutput } from '@/ai/flows/classroom-slide-generator-flow';
import { getCourse } from '@/lib/data-provider';
import { createLessonSlideDeck } from '@/lib/lesson-slide-deck';
import { LearningContentIdSchema, SLIDE_DECK_COUNTS, lessonMaterialForAI } from '@/lib/learning-experience';
import { z } from 'zod';
import {
  getCachedLessonSlidesFromDisk,
  saveCachedLessonSlidesToDisk,
} from '@/lib/lesson-slides-storage-server';

const SlideRequestSchema = ClassroomSlideGeneratorInputSchema.extend({
  courseId: LearningContentIdSchema.optional(),
  forceRegenerate: z.boolean().optional(),
});

function cacheMatches(deck: ClassroomSlideGeneratorOutput, input: z.infer<typeof SlideRequestSchema>): boolean {
  const count = input.deckLength ? SLIDE_DECK_COUNTS[input.deckLength] : input.slideCount;
  const config = deck.generationConfig;
  return deck.slides.length === count && Boolean(config)
    && config?.slideCount === count
    && config.treatment === (input.treatment ?? 'visual')
    && config.learningLevel === input.learningLevel
    && config.visualStyle === input.visualStyle
    && config.enrichVisuals === Boolean(input.enrichVisuals);
}

export async function GET(request: NextRequest) {
  const courseId = LearningContentIdSchema.safeParse(request.nextUrl.searchParams.get('courseId'));
  const lessonId = LearningContentIdSchema.safeParse(request.nextUrl.searchParams.get('lessonId'));

  if (!courseId.success || !lessonId.success) {
    return NextResponse.json(
      { error: 'Valid courseId and lessonId are required.' },
      { status: 400 }
    );
  }

  const course = getCourse(courseId.data);
  if (!course || !Array.isArray(course.lessons) || !course.lessons.some(lesson => lesson.id === lessonId.data)) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
  const cached = await getCachedLessonSlidesFromDisk(courseId.data, lessonId.data);
  if (!cached) {
    return NextResponse.json({ cached: false }, { status: 404 });
  }

  return NextResponse.json({ ...cached, cached: true, source: 'disk' });
}

export async function POST(request: NextRequest) {
  const parsed = SlideRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid slide request.' }, { status: 400 });
  const input = parsed.data;
  const course = input.courseId ? getCourse(input.courseId) : undefined;
  const lesson = course && Array.isArray(course.lessons) ? course.lessons.find(item => item.id === input.lesson.id) : undefined;
  if (input.courseId && (!course || !lesson)) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
  // Identifiers resolve the source material server-side; client text cannot replace a real lesson.
  const groundedInput = course && lesson ? {
    ...input,
    lesson: { id: lesson.id, title: lesson.title, duration: lesson.duration, introduction: { text: lesson.introduction.text.slice(0, 24000) } },
    courseContext: {
      title: course.title, description: course.description,
      lessons: course.lessons.slice(0, 100).map(item => ({ id: item.id, title: item.title, duration: item.duration })),
    },
    lessonMaterial: lessonMaterialForAI(lesson),
  } : input;
  try {
    if (course && lesson && !input.forceRegenerate) {
      const cached = await getCachedLessonSlidesFromDisk(course.id, lesson.id);
      if (cached && cacheMatches(cached, input)) {
        return NextResponse.json({ ...cached, cached: true, source: 'disk' });
      }
    }

    const result = await classroomSlideGenerator(groundedInput);

    if (course && lesson) {
      await saveCachedLessonSlidesToDisk(course.id, lesson.id, result).catch(() => undefined);
    }

    return NextResponse.json({ ...result, cached: false, source: 'generated' });
  } catch {
    if (course && lesson) {
      return NextResponse.json({
        ...createLessonSlideDeck(course, lesson, input),
        cached: false,
        source: 'lesson',
        notice: 'A fresh briefing is unavailable right now. Your course briefing is ready to explore.',
      });
    }

    return NextResponse.json(
      {
        error: 'Your new briefing could not be prepared. Please try again.',
      },
      { status: 503 }
    );
  }
}
