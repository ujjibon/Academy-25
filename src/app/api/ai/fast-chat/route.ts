import { NextRequest, NextResponse } from 'next/server';
import { fastChat } from '@/ai/flows/fast-chat-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await fastChat(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fast chat API error:', error);
    return NextResponse.json(
      { 
        answer: 'I\'m having trouble processing that right now. Please try again.',
        isQuickResponse: true 
      },
      { status: 500 }
    );
  }
}
