import { NextRequest, NextResponse } from 'next/server';
import {
  generateEducationalImage,
  type ImageSize,
} from '@/lib/openai-image-generator';
import { getOpenAIApiKey } from '@/ai/genkit';

const ALLOWED_SIZES: ImageSize[] = ['1024x1024', '1792x1024', '1024x1792'];

export async function POST(request: NextRequest) {
  try {
    if (!getOpenAIApiKey()) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const size = (body.size as ImageSize) || '1024x1024';

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_SIZES.includes(size)) {
      return NextResponse.json(
        { error: `size must be one of: ${ALLOWED_SIZES.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await generateEducationalImage(prompt, { size });

    return NextResponse.json({
      imageDataUrl: result.imageDataUrl,
      revisedPrompt: result.revisedPrompt,
      model: result.model,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
