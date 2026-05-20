import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import {
  buildOutlineLesson,
  planCourseOutline,
  refineCourseWithAgent,
  runCourseArchitectAgent,
} from '@/ai/flows/course-architect-agent-flow';
import { CourseOutlineSchema } from '@/ai/flows/course-lesson-schema';

const MAX_SOURCE_CHARS = 18000;

async function extractBriefFromForm(form: FormData): Promise<{
  brief: string;
  sourceType: 'prompt' | 'pdf';
}> {
  const prompt = String(form.get('prompt') || '').trim();
  const pdf = form.get('pdf') as File | null;

  if (pdf && pdf.size > 0) {
    const bytes = Buffer.from(await pdf.arrayBuffer());
    const parser = new PDFParse({ data: bytes });
    const parsed = await parser.getText();
    await parser.destroy();
    const pdfText = parsed.text?.trim() || '';
    return {
      brief: [prompt, pdfText].filter(Boolean).join('\n\n').slice(0, MAX_SOURCE_CHARS),
      sourceType: 'pdf',
    };
  }

  return { brief: prompt.slice(0, MAX_SOURCE_CHARS), sourceType: 'prompt' };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let phase = 'full';
    let options: Record<string, unknown> = {};
    let lessonId: string | undefined;
    let outlineRaw: unknown;
    let courseRaw: unknown;
    let instruction: string | undefined;
    let brief = '';
    let sourceType: 'prompt' | 'pdf' = 'prompt';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      phase = String(form.get('phase') || 'full');
      lessonId = String(form.get('lessonId') || '') || undefined;
      instruction = String(form.get('instruction') || '') || undefined;
      const optionsJson = String(form.get('options') || '');
      if (optionsJson) options = JSON.parse(optionsJson);
      const outlineJson = String(form.get('outline') || '');
      if (outlineJson) outlineRaw = JSON.parse(outlineJson);
      const courseJson = String(form.get('course') || '');
      if (courseJson) courseRaw = JSON.parse(courseJson);
      const extracted = await extractBriefFromForm(form);
      brief = extracted.brief;
      sourceType = extracted.sourceType;
    } else {
      const body = await request.json();
      phase = body?.phase ?? 'full';
      options = body?.options ?? {};
      lessonId = body?.lessonId;
      outlineRaw = body?.outline;
      courseRaw = body?.course;
      instruction = body?.instruction;
      brief = String(body?.brief || body?.prompt || '').trim().slice(0, MAX_SOURCE_CHARS);
      sourceType = body?.sourceType === 'pdf' ? 'pdf' : 'prompt';
    }

    if (phase === 'plan') {
      if (!brief) {
        return NextResponse.json({ error: 'Brief or PDF required.' }, { status: 400 });
      }
      const outline = await planCourseOutline({ brief, sourceType, options });
      return NextResponse.json({ outline, agentSummary: outline.agentNotes });
    }

    if (phase === 'lesson') {
      const outline = CourseOutlineSchema.parse(outlineRaw);
      if (!lessonId || !brief) {
        return NextResponse.json({ error: 'outline, lessonId, and brief required.' }, { status: 400 });
      }
      const questionsPerLesson =
        typeof options.questionsPerLesson === 'number' ? options.questionsPerLesson : 12;
      const lesson = await buildOutlineLesson({
        brief,
        outline,
        lessonId,
        questionsPerLesson,
      });
      return NextResponse.json({ lesson });
    }

    if (phase === 'refine') {
      if (!instruction || !courseRaw) {
        return NextResponse.json({ error: 'course and instruction required.' }, { status: 400 });
      }
      const result = await refineCourseWithAgent({
        brief,
        instruction,
        course: courseRaw as Parameters<typeof refineCourseWithAgent>[0]['course'],
      });
      return NextResponse.json(result);
    }

    if (!brief) {
      return NextResponse.json({ error: 'Please provide a prompt or PDF.' }, { status: 400 });
    }

    const result = await runCourseArchitectAgent({
      brief,
      sourceType,
      options,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Course architect API error:', error);
    return NextResponse.json({ error: 'Failed to run course architect agent.' }, { status: 500 });
  }
}
