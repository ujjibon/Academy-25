import { NextRequest, NextResponse } from 'next/server';
import { classroomSlideGenerator } from '@/ai/flows/classroom-slide-generator-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received slide generation request:', { 
      lessonTitle: body.lesson?.title,
      courseTitle: body.courseContext?.title,
      slideCount: body.slideCount 
    });
    
    const result = await classroomSlideGenerator(body);
    console.log('Successfully generated slides:', { 
      slideCount: result.slides?.length,
      totalDuration: result.totalDuration 
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating classroom slides:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to generate classroom slides',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}
