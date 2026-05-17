import { NextRequest, NextResponse } from 'next/server';
import { comprehensiveTeaching } from '@/ai/flows/comprehensive-teaching-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await comprehensiveTeaching(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in comprehensive teaching:', error);
    return NextResponse.json(
      { error: 'Failed to generate comprehensive teaching content' },
      { status: 500 }
    );
  }
}
