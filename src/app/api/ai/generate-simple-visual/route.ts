import { NextRequest, NextResponse } from 'next/server';
import { deepSeekVisualGenerator } from '@/lib/deepseek-visual-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, visualType, context, elements, relationships, data } = body;

    if (!topic || !visualType) {
      return NextResponse.json(
        { error: 'Topic and visualType are required' },
        { status: 400 }
      );
    }

    let result;

    switch (visualType) {
      case 'mermaid':
        if (!elements || !relationships) {
          return NextResponse.json(
            { error: 'Elements and relationships are required for Mermaid diagrams' },
            { status: 400 }
          );
        }
        result = await deepSeekVisualGenerator.generateMermaidDiagram(
          topic,
          elements,
          relationships
        );
        break;

      case 'css':
        if (!data) {
          return NextResponse.json(
            { error: 'Data is required for CSS visuals' },
            { status: 400 }
          );
        }
        result = await deepSeekVisualGenerator.generateCSSVisual(topic, data);
        break;

      default:
        result = await deepSeekVisualGenerator.generateSimpleVisual(
          topic,
          visualType,
          context
        );
        break;
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error generating simple visual:', error);
    
    // Return a fallback response
    const fallbackVisual = {
      id: `fallback_${Date.now()}`,
      title: 'Visual Generation Failed',
      type: 'fallback',
      description: 'Unable to generate visual at this time. Please try again later.',
      svgContent: `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
        <text x="200" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
          Visual generation temporarily unavailable
        </text>
      </svg>`,
    };

    return NextResponse.json(
      { 
        result: fallbackVisual,
        error: 'Visual generation failed, using fallback',
        fallback: true 
      },
      { status: 200 } // Return 200 with fallback instead of error
    );
  }
}
