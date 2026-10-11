import { NextRequest, NextResponse } from 'next/server';
import { getCourse } from '@/lib/data-provider';
import { generateTrainingPack } from '@/ai/flows/generate-training-pack-flow';
import { TrainingPackRequestSchema, createLessonTrainingPack } from '@/lib/learning-experience';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = TrainingPackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid training request.' }, { status: 400 });
  }
  const course = getCourse(parsed.data.courseId);
  const lesson = course && Array.isArray(course.lessons) ? course.lessons.find(item => item.id === parsed.data.lessonId) : undefined;
  if (!course || !lesson) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
  try {
    return NextResponse.json(await generateTrainingPack(parsed.data));
  } catch {
    // Curriculum recovery is explicit so a learner can distinguish it from an AI remix.
    return NextResponse.json({
      ...createLessonTrainingPack(course, lesson, parsed.data),
      notice: 'A fresh quest pack is unavailable right now. Your course missions are ready to play.',
    });
  }
}
