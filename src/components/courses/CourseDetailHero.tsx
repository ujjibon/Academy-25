import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CourseDetailNav } from '@/components/courses/CourseDetailNav';
import { StarRating } from '@/components/courses/StarRating';
import {
  formatDurationHours,
  formatEnrollment,
  totalCourseMinutes,
  type CourseDetails,
} from '@/lib/course-details';
import type { Course } from '@/lib/data-provider';
import {
  Clock,
  PlayCircle,
  Users,
  UserCheck,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

export function CourseDetailHero({
  course,
  details,
  firstLessonId,
}: {
  course: Course;
  details: CourseDetails;
  firstLessonId?: string;
}) {
  const totalMin = totalCourseMinutes(course);

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-border/60 bg-card shadow-[0_8px_30px_rgb(0_11_88/0.04)]">
      <div className="p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-10">
          <div className="relative w-full shrink-0 overflow-hidden rounded-[1rem] bg-muted lg:max-w-[380px]">
            <Image
              src={course.image}
              alt={course.title}
              width={760}
              height={428}
              className="aspect-video w-full object-cover"
              data-ai-hint="course detail"
              priority
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col text-left">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full bg-royal/10 px-3 py-0.5 text-xs font-semibold text-royal hover:bg-royal/10"
              >
                {details.level}
              </Badge>
              {course.category === 'programming' ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-midnight/20 text-xs text-midnight"
                >
                  Programming
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-full border-flare/30 text-xs text-flare"
                >
                  Masters Class
                </Badge>
              )}
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-tight text-midnight sm:text-4xl text-balance">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
              {course.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <StarRating rating={details.rating} />
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                {details.reviewCount.toLocaleString()} reviews
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {formatEnrollment(details.enrolledCount)} enrolled
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                {formatEnrollment(details.participantsActive)} active now
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 shrink-0 text-royal" />
                <span className="font-medium text-midnight">{details.instructorName}</span>
                <span>· {details.instructorTitle}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0 text-royal" />
                {formatDurationHours(totalMin)} · {course.lessons.length} lessons
              </span>
            </div>

            {details.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {details.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              {firstLessonId ? (
                <Button asChild className="brand-button h-11 rounded-full px-6 w-full sm:w-auto">
                  <Link href={`/courses/${course.id}/${firstLessonId}`}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start learning
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-full px-5 sm:w-auto"
              >
                <Link href={`/courses/${course.id}/curriculum`}>View curriculum</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-full px-5 sm:w-auto"
              >
                <Link href={`/courses/${course.id}/materials`}>View materials</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-border/50 pt-5">
          <CourseDetailNav courseId={course.id} />
        </div>
      </div>
    </section>
  );
}

export function CourseStatsStrip({
  details,
  lessonCount,
  totalMinutes,
}: {
  details: CourseDetails;
  lessonCount: number;
  totalMinutes: number;
}) {
  const items = [
    {
      label: 'Rating',
      value: details.rating.toFixed(1),
      hint: `${details.reviewCount.toLocaleString()} reviews`,
    },
    {
      label: 'Enrolled',
      value: formatEnrollment(details.enrolledCount),
      hint: 'learners joined',
    },
    {
      label: 'Participants',
      value: formatEnrollment(details.participantsActive),
      hint: 'active this week',
    },
    {
      label: 'Curriculum',
      value: String(lessonCount),
      hint: formatDurationHours(totalMinutes),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[1rem] border border-border/60 bg-card px-5 py-4 text-left shadow-[0_4px_16px_rgb(0_11_88/0.03)]"
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1.5 font-heading text-2xl font-bold tabular-nums tracking-tight text-midnight sm:text-[1.65rem]">
            {item.value}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}
