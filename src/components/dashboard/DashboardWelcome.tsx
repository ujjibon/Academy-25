'use client';

import Link from 'next/link';
import { Zap, BookOpen } from 'lucide-react';
import { UserProfile } from '@/lib/firebase';
import { getCourse } from '@/lib/data-provider';

interface DashboardWelcomeProps {
  userProfile: UserProfile;
}

function getProfileStrength(userProfile: UserProfile): number {
  const skills = [...userProfile.strengths, ...userProfile.weaknesses];
  if (skills.length > 0) {
    const avg = skills.reduce((sum, s) => sum + s.value, 0) / skills.length;
    return Math.round(avg);
  }
  const weekly = userProfile.weeklyProgress ?? 0;
  if (weekly > 0) return Math.min(100, weekly);
  return Math.min(100, userProfile.level * 12);
}

export function DashboardWelcome({ userProfile }: DashboardWelcomeProps) {
  const firstName = userProfile.displayName.split(' ')[0] || 'there';
  const profileStrength = getProfileStrength(userProfile);
  const activeCourse = getCourse(userProfile.activeCourseId || '');
  const lessonHref = activeCourse
    ? `/courses/${activeCourse.id}/${userProfile.activeLessonId || activeCourse.lessons[0]?.id || '1'}`
    : '/courses';

  return (
    <section className="dashboard-hero p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-5 max-w-xl">
          <span className="dashboard-kicker">Learning workspace</span>
          <h1 className="font-dashboard-title text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Good to see you, {firstName}.
          </h1>
          <div className="flex flex-wrap gap-3">
            <Link href={lessonHref} className="brand-button gap-2">
              <Zap className="h-4 w-4" />
              Continue learning
            </Link>
            <Link href="/courses" className="brand-button-ghost gap-2">
              <BookOpen className="h-4 w-4" />
              Browse courses
            </Link>
          </div>
        </div>

        <div className="dashboard-widget w-full max-w-sm lg:max-w-xs shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-semibold text-foreground">AI learning monitor</p>
            <span className="badge-royal py-0.5">
              <span className="dot-flare" aria-hidden />
              Live
            </span>
          </div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Profile strength
          </p>
          <div className="progress-brand mb-1">
            <div
              className="progress-brand-fill"
              style={{ width: `${profileStrength}%` }}
            />
          </div>
          <p className="text-right text-sm font-semibold text-primary">{profileStrength}%</p>
        </div>
      </div>
    </section>
  );
}
