import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react';
import { getCourse } from '@/lib/data-provider';
import { UserProfile } from '@/lib/firebase';

interface ActiveCourseProps {
  userProfile: UserProfile;
}

export function ActiveCourse({ userProfile }: ActiveCourseProps) {
  const activeCourse = getCourse(userProfile.activeCourseId || '');

  if (!activeCourse) {
    return (
      <section className="dashboard-panel flex h-full min-h-[11rem] flex-col p-6">
        <span className="dashboard-kicker mb-4">Active course</span>
        <div className="flex flex-1 flex-col items-center justify-center text-center py-4">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="font-heading font-semibold text-foreground">Start learning</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a course to begin your journey
          </p>
        </div>
        <Link href="/courses" className="brand-button w-fit gap-2 mt-4">
          Browse courses
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  const nextLesson = activeCourse.lessons.find((l) => l.id === userProfile.activeLessonId);
  const progress = Math.round(userProfile.courseProgress[activeCourse.id] || 0);
  const lessonHref = `/courses/${activeCourse.id}/${userProfile.activeLessonId || activeCourse.lessons[0]?.id || '1'}`;

  return (
    <section className="dashboard-panel flex h-full min-h-[11rem] flex-col p-6">
      <header className="flex items-start justify-between mb-4">
        <span className="dashboard-kicker">Continue learning</span>
        <Link
          href={lessonHref}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-foreground hover:bg-foreground/10"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>
      <div className="flex flex-1 gap-4">
        <Image
          src={activeCourse.image}
          alt={activeCourse.title}
          width={120}
          height={80}
          className="rounded-xl object-cover h-20 w-28 shrink-0"
          data-ai-hint="learning course"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Course</p>
          <h3 className="font-heading font-semibold text-lg truncate">{activeCourse.title}</h3>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <div className="progress-brand">
              <span
                className="progress-brand-fill block h-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {nextLesson ? (
            <p className="text-sm text-muted-foreground mt-3 truncate">
              Next: <span className="text-foreground font-medium">{nextLesson.title}</span>
            </p>
          ) : null}
        </div>
      </div>
      <Link href={lessonHref} className="brand-button w-fit gap-2 mt-5">
        Go to lesson
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
