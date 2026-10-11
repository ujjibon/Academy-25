import { NextRequest, NextResponse } from 'next/server';
import { generateLearningGame } from '@/ai/flows/generate-learning-game-flow';
import { z } from 'zod';
import { GenerateLearningGameInputSchema, LEARNING_GAME_TYPES } from '@/lib/learning-games';
import { getCourse } from '@/lib/data-provider';
import { LearningContentIdSchema, lessonMaterialForAI } from '@/lib/learning-experience';

const GameRequestSchema = z.object({
  courseId: LearningContentIdSchema.optional(),
  lessonId: LearningContentIdSchema.optional(),
  courseTitle: z.string().trim().min(1).max(240).optional(),
  courseDescription: z.string().trim().max(4000).optional(),
  lessonTitles: z.array(z.string().trim().min(1).max(240)).min(1).max(60).optional(),
  topicFocus: z.string().trim().max(500).optional(),
  gameType: z.enum(LEARNING_GAME_TYPES),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = GameRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid game request.' }, { status: 400 });
    const input = parsed.data;
    if (input.lessonId && !input.courseId) {
      return NextResponse.json({ error: 'courseId is required for a lesson game.' }, { status: 400 });
    }
    const course = input.courseId ? getCourse(input.courseId) : undefined;
    if (input.courseId && (!course || !Array.isArray(course.lessons))) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    const lesson = course?.lessons.find(item => input.lessonId ? item.id === input.lessonId : item.title === input.topicFocus);
    if (input.lessonId && !lesson) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    const selectedLessons = lesson ? [lesson] : course?.lessons.filter((_, index, all) => {
      // Sample across the entire course, rather than truncating to its first lessons.
      if (all.length <= 12) return true;
      return Array.from({ length: 12 }, (_, sample) => Math.round(sample * (all.length - 1) / 11)).includes(index);
    });
    const flowInput = GenerateLearningGameInputSchema.safeParse({
      courseTitle: course?.title ?? input.courseTitle,
      courseDescription: course?.description ?? input.courseDescription ?? input.courseTitle,
      lessonTitles: lesson ? [lesson.title] : course?.lessons.slice(0, 60).map(item => item.title) ?? input.lessonTitles,
      lessonMaterial: selectedLessons?.map(item => lessonMaterialForAI(item).slice(0, 3900)).join('\n\n').slice(0, 48000),
      topicFocus: lesson?.title ?? input.topicFocus,
      gameType: input.gameType,
      difficulty: input.difficulty,
    });
    if (!flowInput.success) return NextResponse.json({ error: 'Course and lesson context are required.' }, { status: 400 });
    const result = await generateLearningGame(flowInput.data);
    return NextResponse.json({ ...result, source: 'openai' });
  } catch {
    return NextResponse.json(
      { error: 'OpenAI could not generate a valid game. Your curriculum game is still available; please try again.' },
      { status: 503 }
    );
  }
}
