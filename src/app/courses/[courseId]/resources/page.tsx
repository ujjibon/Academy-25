import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { CourseDetailHero } from '@/components/courses/CourseDetailHero';
import {
  RESOURCE_CATEGORY_LABEL,
  getCourseDetails,
  type CourseResource,
} from '@/lib/course-details';
import { getCourse } from '@/lib/data-provider';
import type { ComponentType } from 'react';
import {
  BookMarked,
  ExternalLink,
  FileText,
  Sparkles,
  Settings,
  Users,
  ArrowUpRight,
} from 'lucide-react';

const CATEGORY_ICON: Record<
  CourseResource['category'],
  ComponentType<{ className?: string }>
> = {
  docs: FileText,
  tool: Settings,
  article: Sparkles,
  community: Users,
  reference: BookMarked,
};

export default async function CourseResourcesPage({
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
              Recommended resources
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Docs, tools, and references curated for {course.title}.
            </p>
          </header>

          <ul className="grid gap-3 sm:grid-cols-2">
            {details.resources.map((resource) => {
              const Icon = CATEGORY_ICON[resource.category];
              const external = Boolean(resource.external);

              return (
                <li key={resource.id}>
                  <Link
                    href={resource.href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="group flex h-full flex-col gap-3 rounded-[1rem] border border-border/60 bg-background/80 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_8px_24px_rgb(0_11_88/0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      {external ? (
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      )}
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2 rounded-full text-xs font-medium">
                        {RESOURCE_CATEGORY_LABEL[resource.category]}
                      </Badge>
                      <h3 className="font-heading text-base font-semibold leading-snug">
                        {resource.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {resource.description}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
