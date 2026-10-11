import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type { ClassroomSlideGeneratorOutput } from '@/ai/flows/classroom-slide-generator-flow';

const SLIDES_DIR = join(process.cwd(), 'src/data/classroom-slides');

function getSlideFilePath(courseId: string, lessonId: string): string {
  return join(SLIDES_DIR, courseId, `${lessonId}.json`);
}

export async function getCachedLessonSlidesFromDisk(
  courseId: string,
  lessonId: string
): Promise<ClassroomSlideGeneratorOutput | null> {
  try {
    const raw = await readFile(getSlideFilePath(courseId, lessonId), 'utf-8');
    const parsed = JSON.parse(raw) as ClassroomSlideGeneratorOutput;
    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedLessonSlidesToDisk(
  courseId: string,
  lessonId: string,
  data: ClassroomSlideGeneratorOutput
): Promise<void> {
  // Strip large base64 images from disk cache to keep JSON manageable;
  // SVG/Mermaid stay. Images can be re-generated via "Generate visuals".
  const slim: ClassroomSlideGeneratorOutput = {
    ...data,
    slides: data.slides.map((slide) => ({
      ...slide,
      imageDataUrl: undefined,
      visualData: slide.visualData
        ? {
            ...slide.visualData,
            url: slide.visualData.url?.startsWith('data:')
              ? undefined
              : slide.visualData.url,
            data: slide.visualData.data
              ? {
                  ...slide.visualData.data,
                  imageDataUrl: undefined,
                }
              : undefined,
          }
        : undefined,
    })),
  };
  const filePath = getSlideFilePath(courseId, lessonId);
  await mkdir(join(SLIDES_DIR, courseId), { recursive: true });
  await writeFile(filePath, JSON.stringify(slim, null, 2), 'utf-8');
}
