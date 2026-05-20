import { NextRequest, NextResponse } from 'next/server';
import { generateSkillTraining } from '@/ai/flows/generate-skill-training-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const skill = String(body?.skill || '').trim();
    const skillLevel = body?.skillLevel || 'beginner';
    const goals = body?.goals ? String(body.goals).trim() : undefined;

    if (!skill) {
      return NextResponse.json({ error: 'Skill name is required.' }, { status: 400 });
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(skillLevel)) {
      return NextResponse.json({ error: 'Invalid skill level.' }, { status: 400 });
    }

    const result = await generateSkillTraining({
      skill,
      skillLevel,
      goals,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Skill training API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate training program. Please try again.' },
      { status: 500 }
    );
  }
}
