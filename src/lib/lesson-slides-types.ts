import type { ClassroomSlideGeneratorOutput } from '@/ai/flows/classroom-slide-generator-flow';

/** Full AI slide deck stored after first generation */
export type CachedLessonSlides = ClassroomSlideGeneratorOutput & {
  courseId: string;
  lessonId: string;
  generatedAt?: string;
};

export function lessonSlidesDocId(courseId: string, lessonId: string): string {
  return `${courseId}__${lessonId}`;
}
