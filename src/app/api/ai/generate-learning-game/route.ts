import { NextRequest, NextResponse } from 'next/server';
import { generateLearningGame } from '@/ai/flows/generate-learning-game-flow';
import { LEARNING_GAME_TYPES, type LearningGameType } from '@/lib/learning-games';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courseTitle = String(body?.courseTitle || '').trim();
    const courseDescription = String(body?.courseDescription || '').trim();
    const lessonTitles = Array.isArray(body?.lessonTitles)
      ? body.lessonTitles.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];
    const topicFocus = body?.topicFocus ? String(body.topicFocus).trim() : undefined;
    const gameType = body?.gameType as LearningGameType | undefined;
    const difficulty = body?.difficulty || 'medium';

    if (!courseTitle) {
      return NextResponse.json({ error: 'Course title is required.' }, { status: 400 });
    }
    if (lessonTitles.length === 0) {
      return NextResponse.json({ error: 'At least one lesson title is required.' }, { status: 400 });
    }
    if (!gameType || !LEARNING_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type.' }, { status: 400 });
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty.' }, { status: 400 });
    }

    const result = await generateLearningGame({
      courseTitle,
      courseDescription: courseDescription || courseTitle,
      lessonTitles,
      topicFocus,
      gameType,
      difficulty,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Learning game API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate game. Please try again.' },
      { status: 500 }
    );
  }
}
