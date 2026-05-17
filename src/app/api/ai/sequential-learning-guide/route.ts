import { NextRequest, NextResponse } from 'next/server';
import { sequentialLearningGuide } from '@/ai/flows/sequential-learning-guide-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await sequentialLearningGuide(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sequential learning guide:', error);
    return NextResponse.json(
      { error: 'Failed to generate sequential learning guide' },
      { status: 500 }
    );
  }
}
