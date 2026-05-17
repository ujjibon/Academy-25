import { NextRequest, NextResponse } from 'next/server';
import { quickTeaching } from '@/ai/flows/quick-teaching-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await quickTeaching(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Quick teaching API error:', error);
    return NextResponse.json(
      { 
        teachingContent: 'I\'m having trouble processing that right now. Please try again.',
        keyPoints: ['Please try rephrasing your question'],
        example: 'I\'ll be happy to help once I can process your request.',
        nextStep: 'Try asking your question in a different way.',
      },
      { status: 500 }
    );
  }
}
