import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { bootcampStudio } from '@/ai/flows/bootcamp-studio-flow';

const MAX_SOURCE_CHARS = 18000;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let requirements = '';
    let sourceType: 'prompt' | 'pdf' = 'prompt';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const prompt = String(form.get('prompt') || '').trim();
      const pdf = form.get('pdf') as File | null;

      if (pdf && pdf.size > 0) {
        const bytes = Buffer.from(await pdf.arrayBuffer());
        const parser = new PDFParse({ data: bytes });
        const parsed = await parser.getText();
        await parser.destroy();
        const pdfText = parsed.text?.trim() || '';
        requirements = [prompt, pdfText].filter(Boolean).join('\n\n');
        sourceType = 'pdf';
      } else {
        requirements = prompt;
      }
    } else {
      const body = await request.json();
      requirements = String(body?.requirements || '').trim();
      sourceType = body?.sourceType === 'pdf' ? 'pdf' : 'prompt';
    }

    if (!requirements) {
      return NextResponse.json(
        { error: 'Please provide prompt text or upload a PDF.' },
        { status: 400 }
      );
    }

    const result = await bootcampStudio({
      requirements: requirements.slice(0, MAX_SOURCE_CHARS),
      sourceType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bootcamp designer API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bootcamp design.' },
      { status: 500 }
    );
  }
}
