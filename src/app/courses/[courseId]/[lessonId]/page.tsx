import AppLayout from '@/components/layout/AppLayout';
import { getCourse } from '@/lib/data-provider';
import { notFound } from 'next/navigation';
import { LessonContent } from '@/components/courses/LessonContent';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const course = getCourse(params.courseId);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === params.lessonId);
  if (lessonIndex === -1) notFound();

  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          href={`/courses/${course.id}`}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {course.title}
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {lesson.title}
          </h1>
        </div>
        <LessonContent course={course} lesson={lesson} />

        <div className="flex justify-between mt-8">
          {prevLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Link>
            </Button>
          ) : <div />}
          {nextLesson ? (
            <Button asChild>
              <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
             <Button>Complete Course</Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
