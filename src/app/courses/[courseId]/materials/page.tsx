import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CourseDetailHero } from '@/components/courses/CourseDetailHero';
import {
  MATERIAL_TYPE_LABEL,
  getCourseDetails,
  type CourseMaterial,
} from '@/lib/course-details';
import { getCourse } from '@/lib/data-provider';
import type { ComponentType } from 'react';
import {
  ClipboardList,
  FileText,
  FolderOpen,
  ListChecks,
  BookOpen,
  Award,
  ArrowRight,
} from 'lucide-react';

const TYPE_ICON: Record<CourseMaterial['type'], ComponentType<{ className?: string }>> = {
  'lesson-guide': FileText,
  worksheet: ClipboardList,
  checklist: ListChecks,
  'project-brief': Award,
  'slide-deck': BookOpen,
  handout: FolderOpen,
};

export default async function CourseMaterialsPage({
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
              Course materials
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {details.materials.length} study packs aligned to each lesson — guides, worksheets,
              and project briefs.
            </p>
          </header>

          <ul className="grid gap-3">
            {details.materials.map((material, index) => {
              const Icon = TYPE_ICON[material.type];
              const href = material.lessonId
                ? `/courses/${course.id}/${material.lessonId}`
                : `/courses/${course.id}`;

              return (
                <li
                  key={material.id}
                  className="flex flex-col gap-4 rounded-[1rem] border border-border/60 bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 gap-3 sm:gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <Badge variant="secondary" className="rounded-full text-xs font-medium">
                          {MATERIAL_TYPE_LABEL[material.type]}
                        </Badge>
                        {material.durationLabel ? (
                          <span className="text-xs text-muted-foreground">
                            {material.durationLabel}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="font-heading text-base font-semibold leading-snug">
                        {material.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {material.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 w-full shrink-0 rounded-full sm:w-auto"
                  >
                    <Link href={href}>
                      Open with lesson
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
