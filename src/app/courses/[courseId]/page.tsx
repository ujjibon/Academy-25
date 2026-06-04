import { use } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { getCourse } from '@/lib/data-provider';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Clock, PlayCircle } from 'lucide-react';
import { CourseCertificateSection } from '@/components/certificates/CourseCertificateSection';

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const course = getCourse(courseId);

  if (!course) {
    notFound();
  }

  const firstLessonId = course.lessons[0]?.id;

  return (
    <AppLayout>
      <div className="page-stack mx-auto w-full max-w-4xl">
        <section className="dashboard-hero hero-padding overflow-hidden">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
            <div className="w-full shrink-0 md:max-w-[280px]">
              <Image
                src={course.image}
                alt={course.title}
                width={400}
                height={225}
                className="aspect-video w-full rounded-[calc(var(--radius)-12px)] object-cover shadow-sm"
                data-ai-hint="course detail"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="dashboard-kicker mb-3 w-fit">Course</span>
              <h1 className="page-title">{course.title}</h1>
              <p className="page-subtitle">{course.description}</p>
              {firstLessonId ? (
                <Button asChild className="brand-button mt-5 w-full sm:mt-6 sm:w-auto">
                  <Link href={`/courses/${course.id}/${firstLessonId}`}>
                    Start learning
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <CourseCertificateSection courseId={course.id} courseTitle={course.title} />

        <section className="dashboard-panel panel-padding">
          <header className="mb-4 text-left sm:mb-5">
            <h2 className="font-dashboard-title text-xl font-bold tracking-tight sm:text-2xl">
              Course curriculum
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {course.lessons.length} lesson{course.lessons.length === 1 ? '' : 's'}
            </p>
          </header>
          <Accordion type="single" collapsible className="w-full">
            {course.lessons.map((lesson, index) => (
              <AccordionItem value={`item-${index}`} key={lesson.id}>
                <AccordionTrigger className="hover:no-underline">
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
                  <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pl-[3.25rem]">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0 text-primary/80" />
                      <span>{lesson.duration} min</span>
                    </div>
                    <Button
                      variant="outline"
                      asChild
                      className="h-10 w-full justify-center rounded-full sm:w-auto"
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
