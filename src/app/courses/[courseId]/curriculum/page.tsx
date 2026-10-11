import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CourseDetailHero } from '@/components/courses/CourseDetailHero';
import { getCourseDetails, totalCourseMinutes } from '@/lib/course-details';
import { getCourse } from '@/lib/data-provider';
import { Clock, PlayCircle } from 'lucide-react';

export default async function CourseCurriculumPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  const details = getCourseDetails(courseId);

  if (!course || !details) {
    notFound();
  }

  const firstLessonId = course.lessons[0]?.id;
  const totalMin = totalCourseMinutes(course);

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6">
        <CourseDetailHero
          course={course}
          details={details}
          firstLessonId={firstLessonId}
        />

        <section className="rounded-[1.25rem] border border-border/60 bg-card p-5 shadow-[0_6px_24px_rgb(0_11_88/0.03)] sm:p-7">
          <header className="mb-5 text-left">
            <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
              Course curriculum
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {course.lessons.length} lesson{course.lessons.length === 1 ? '' : 's'} ·{' '}
              {totalMin} minutes total · guided Learn → Practice → Project → Assess
            </p>
          </header>

          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {course.lessons.map((lesson, index) => (
              <AccordionItem
                value={`item-${index}`}
                key={lesson.id}
                className="border-border/60"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3 pr-2 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-snug sm:text-base">
                      {lesson.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-[0.9375rem]">
                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pl-[3.25rem]">
                    <div className="space-y-1.5 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-primary/80" />
                        <span>{lesson.duration} min</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground/90">
                        Includes introduction, practice quiz, project
                        {lesson.project?.title ? ` (“${lesson.project.title}”)` : ''}, and
                        assessment.
                      </p>
                    </div>
                    <Button
                      asChild
                      className="brand-button h-10 w-full justify-center rounded-full sm:w-auto"
                    >
                      <Link href={`/courses/${course.id}/${lesson.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4 shrink-0" />
                        Start lesson
                      </Link>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </AppLayout>
  );
}
