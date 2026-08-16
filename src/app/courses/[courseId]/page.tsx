import type { ComponentType, ReactNode } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  BookMarked,
  Layers,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { CourseCertificateSection } from '@/components/certificates/CourseCertificateSection';
import {
  CourseDetailHero,
  CourseStatsStrip,
} from '@/components/courses/CourseDetailHero';
import { getCourseDetails, totalCourseMinutes } from '@/lib/course-details';
import { getCourse } from '@/lib/data-provider';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CourseDetailPage({
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

        <CourseStatsStrip
          details={details}
          lessonCount={course.lessons.length}
          totalMinutes={totalMin}
        />

        <SectionCard>
          <header className="mb-5 text-left">
            <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
              What you&apos;ll learn
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Outcomes for {details.level.toLowerCase()} learners · {details.language}
            </p>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-3.5">
            {details.learningOutcomes.map((outcome) => (
              <li key={outcome} className="flex gap-3 text-sm leading-relaxed sm:text-[0.95rem]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-royal" />
                </span>
                <span className="text-midnight/90">{outcome}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <section className="grid gap-4 sm:grid-cols-3">
          <QuickLinkCard
            href={`/courses/${course.id}/curriculum`}
            icon={Layers}
            title="Curriculum"
            description={`${course.lessons.length} interactive lessons with practice and projects.`}
          />
          <QuickLinkCard
            href={`/courses/${course.id}/materials`}
            icon={ClipboardList}
            title="Materials"
            description={`${details.materials.length} study packs, worksheets, and project briefs.`}
          />
          <QuickLinkCard
            href={`/courses/${course.id}/resources`}
            icon={BookMarked}
            title="Resources"
            description={`${details.resources.length} docs, tools, and references to go further.`}
          />
        </section>

        <SectionCard>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-royal/10 text-sm font-bold text-royal">
                {details.instructorName
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Instructor
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-midnight">{details.instructorName}</p>
                <p className="text-sm text-muted-foreground">{details.instructorTitle}</p>
              </div>
            </div>
            {firstLessonId ? (
              <Button asChild className="brand-button h-11 rounded-full px-6 w-full sm:w-auto">
                <Link href={`/courses/${course.id}/${firstLessonId}`}>
                  Begin course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </SectionCard>

        <CourseCertificateSection courseId={course.id} courseTitle={course.title} />

        <p className="px-1 text-center text-xs text-muted-foreground sm:text-sm">
          Free to browse.{' '}
          <Link
            href={`/signup?redirect=${encodeURIComponent(`/courses/${course.id}`)}`}
            className="font-medium text-royal hover:underline"
          >
            Sign up
          </Link>{' '}
          to save progress — or{' '}
          <Link
            href={`/login?redirect=${encodeURIComponent(`/courses/${course.id}`)}`}
            className="font-medium text-royal hover:underline"
          >
            log in
          </Link>
          .
        </p>
      </div>
    </AppLayout>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-border/60 bg-card p-5 shadow-[0_6px_24px_rgb(0_11_88/0.03)] sm:p-7">
      {children}
    </section>
  );
}

function QuickLinkCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-[1.25rem] border border-border/60 bg-card p-5 shadow-[0_6px_24px_rgb(0_11_88/0.03)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_10px_28px_rgb(0_11_88/0.06)]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/10 text-royal">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-heading text-base font-semibold text-royal">{title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-royal">
        Open
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
