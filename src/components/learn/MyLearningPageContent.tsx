'use client';

import Link from 'next/link';
import {
  Award,
  BookOpen,
  BrainCircuit,
  Clock,
  Flame,
  GitBranch,
  GitMerge,
  Hexagon,
  MessageSquare,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectionError } from '@/components/ui/connection-error';
import { CourseCard } from '@/components/courses/CourseCard';
import { ActiveCourse } from '@/components/dashboard/ActiveCourse';
import { DynamicLearningHub } from '@/components/learn/DynamicLearningHub';
import { courses as catalog, mastersCourses } from '@/lib/courses';
import { getCourse } from '@/lib/data-provider';
import type { UserProfile } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const badgeIconMap: Record<string, React.ElementType> = {
  Award,
  Flame,
  Star,
  GitMerge,
  MessageSquare,
  Users,
};

const TIERS = [
  { name: 'Bronze', minXp: 0, color: 'bg-amber-700/15 text-amber-800 border-amber-700/25' },
  { name: 'Silver', minXp: 500, color: 'bg-slate-400/15 text-slate-600 border-slate-400/30' },
  { name: 'Gold', minXp: 1500, color: 'bg-amber-400/20 text-amber-700 border-amber-500/30' },
  { name: 'Platinum', minXp: 3000, color: 'bg-primary/10 text-primary border-primary/25' },
  { name: 'Diamond', minXp: 5000, color: 'bg-primary/10 text-primary border-primary/25' },
] as const;

function getTierInfo(xp: number) {
  let current = TIERS[0];
  let next: (typeof TIERS)[number] | null = TIERS[1];
  for (let i = 0; i < TIERS.length; i++) {
    if (xp >= TIERS[i].minXp) {
      current = TIERS[i];
      next = TIERS[i + 1] ?? null;
    }
  }
  const floor = current.minXp;
  const ceiling = next?.minXp ?? floor + 1000;
  const progressInTier = xp - floor;
  const tierSpan = Math.max(1, ceiling - floor);
  const pct = next ? Math.min(100, Math.round((progressInTier / tierSpan) * 100)) : 100;
  const ptsAway = next ? Math.max(0, ceiling - xp) : 0;
  return { current, next, floor, ceiling, pct, ptsAway, progressInTier };
}

function formatLearningTime(minutes: number) {
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = Math.floor(minutes % 60);
  return { days, hours, mins };
}

function streakDays(streak: number) {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (4 - i));
    const dayIndexFromEnd = 4 - i;
    const active = streak > 0 && dayIndexFromEnd < streak;
    return {
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      active,
      isToday: i === 4,
    };
  });
}

function TierRing({
  value,
  max,
  pct,
}: {
  value: number;
  max: number;
  pct: number;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden>
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="rgb(var(--royal))"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          {value}
          <span className="text-muted-foreground font-semibold"> / {max}</span>
        </span>
      </div>
    </div>
  );
}

function LearningStatsPanel({ userProfile }: { userProfile: UserProfile }) {
  const weeklyPts = userProfile.weeklyProgress || 0;
  const displayStreakWeeks =
    userProfile.dailyStreak > 0 ? Math.max(1, Math.ceil(userProfile.dailyStreak / 7)) : 0;
  const days = streakDays(userProfile.dailyStreak || 0);
  const coursesCompleted = userProfile.completedCourses?.length ?? 0;
  const tracksInProgress = Object.keys(userProfile.courseProgress || {}).length;
  const learningMinutes = Object.entries(userProfile.courseProgress || {}).reduce(
    (sum, [courseId, progress]) => {
      const course = getCourse(courseId);
      if (!course) return sum;
      const totalMins = course.lessons.reduce((m, l) => m + (l.duration || 0), 0);
      return sum + Math.round((totalMins * (progress || 0)) / 100);
    },
    0
  );
  const time = formatLearningTime(learningMinutes);
  const tier = getTierInfo(userProfile.xp || 0);
  const badges = userProfile.badges || [];

  return (
    <section className="dashboard-panel overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_minmax(240px,280px)]">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3">
          {/* Weekly ranking */}
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6">
            <p className="text-sm font-semibold text-foreground">Weekly ranking</p>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-2">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarImage src={userProfile.photoURL || ''} alt={userProfile.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userProfile.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold text-primary-foreground shadow-sm">
                  <Target className="h-2.5 w-2.5" />
                  {weeklyPts}
                </span>
              </div>
            </div>
            <Link
              href="/leaderboard"
              className="text-sm font-medium text-primary hover:underline w-fit"
            >
              View leaderboard
            </Link>
          </div>

          {/* Weekly streak */}
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 sm:border-l xl:border-l">
            <p className="text-sm font-semibold text-foreground">Weekly streak</p>
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div
                className={cn(
                  'flex h-16 w-16 flex-col items-center justify-center rounded-2xl text-center',
                  displayStreakWeeks > 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <span className="font-heading text-2xl font-bold leading-none">
                  {displayStreakWeeks}
                </span>
                <span className="text-[0.65rem] font-medium opacity-90 mt-0.5">
                  {displayStreakWeeks === 1 ? 'Week' : 'Weeks'}
                </span>
              </div>
              <div className="flex w-full justify-between gap-1">
                {days.map((day) => (
                  <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border text-xs',
                        day.active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/40 text-muted-foreground'
                      )}
                    >
                      {day.active ? (
                        <span className="font-bold">✓</span>
                      ) : (
                        <span className="opacity-40">·</span>
                      )}
                    </span>
                    <span className="text-[0.6rem] text-muted-foreground whitespace-nowrap">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Completion to date */}
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:p-6 sm:col-span-2 xl:col-span-1 xl:border-l">
            <p className="text-sm font-semibold text-foreground">Completion to date</p>
            <div className="grid flex-1 grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="font-heading text-2xl font-bold tracking-tight">
                  {coursesCompleted}
                </span>
                <span className="text-xs text-muted-foreground">Courses</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <GitBranch className="h-4 w-4" />
                </span>
                <span className="font-heading text-2xl font-bold tracking-tight">
                  {tracksInProgress}
                </span>
                <span className="text-xs text-muted-foreground">In progress</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </span>
                <span className="font-heading text-sm font-bold tracking-tight leading-snug">
                  {time.days}d {time.hours}h {time.mins}m
                </span>
                <span className="text-xs text-muted-foreground">Learning</span>
              </div>
            </div>
          </div>

          {/* Lifetime points */}
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:p-6 lg:border-b-0">
            <p className="text-sm font-semibold text-foreground">Peer Academy lifetime points</p>
            <div className="flex flex-1 items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Hexagon className="h-6 w-6" />
              </span>
              <span className="font-heading text-3xl font-bold tracking-tight">
                {userProfile.xp ?? 0}
              </span>
            </div>
          </div>

          {/* Achieved badges */}
          <div className="flex flex-col gap-3 p-5 sm:p-6 sm:border-l sm:col-span-2 xl:col-span-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Achieved badges</p>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                {badges.length}
              </span>
            </div>
            {badges.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Earn badges as you learn — keep your streak going.
              </p>
            ) : (
              <div className="flex flex-wrap gap-4 pt-1">
                {badges.slice(0, 6).map((badge, index) => {
                  const Icon = badgeIconMap[badge.icon] || Award;
                  return (
                    <div
                      key={`${badge.name}-${index}`}
                      className="flex w-20 flex-col items-center gap-2 text-center"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary/5 text-primary">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-[0.7rem] font-medium text-foreground leading-tight line-clamp-2">
                        {badge.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Current tier — tall column */}
        <div className="flex flex-col gap-4 border-t border-border p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Current tier</p>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                tier.current.color
              )}
            >
              {tier.current.name}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
            <TierRing
              value={userProfile.xp ?? 0}
              max={tier.next ? tier.ceiling : tier.floor + 1000}
              pct={tier.pct}
            />
            {tier.next ? (
              <p className="text-sm text-muted-foreground text-center">
                {tier.ptsAway} pts away from{' '}
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold align-middle',
                    tier.next.color
                  )}
                >
                  {tier.next.name}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Top tier unlocked</p>
            )}
          </div>
          <Link href="/profile" className="text-sm font-medium text-primary hover:underline w-fit">
            View progress
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MyLearningPageContent() {
  const { userProfile, loading, connectionError, retryConnection } = useAuth();

  if (loading) {
    return (
      <div className="page-stack max-w-6xl">
        <Skeleton className="h-16 w-full max-w-xl" />
        <Skeleton className="h-80 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-28 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="page-stack max-w-6xl">
        <header>
          <h1 className="page-title">My Learning</h1>
          <p className="mt-2 text-muted-foreground">
            We&apos;re having trouble connecting to your data.
          </p>
        </header>
        <ConnectionError error={connectionError} onRetry={retryConnection} isLoading={loading} />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="dashboard-panel flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-semibold mb-2">No profile found</h2>
          <p className="text-muted-foreground">Please log in to view your learning progress.</p>
        </div>
      </div>
    );
  }

  const recommended = catalog.filter((c) => !c.id.startsWith('masters-')).slice(0, 4);

  return (
    <div className="page-stack max-w-6xl">
      <header className="space-y-2">
        <h1 className="page-title">My Learning</h1>
        <p className="text-muted-foreground max-w-2xl">
          A full learning loop — adaptive path, spaced reviews, notes, and progress that follows you.
        </p>
      </header>

      <DynamicLearningHub />

      <LearningStatsPanel userProfile={userProfile} />

      <section className="cta-band-royal">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            Peer Academy AI
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl text-balance">
            Make progress your daily habit.
          </h2>
          <p className="text-sm text-white/75 leading-relaxed">
            Get a personalized plan from your AI coach — strengths, gaps, and what to study next.
          </p>
        </div>
        <Link href="/learn/path" className="cta-band-button">
          <BrainCircuit className="h-4 w-4" />
          Open adaptive path
        </Link>
      </section>

      <ActiveCourse userProfile={userProfile} />

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Masters Class
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Codex, Antigravity, Claude, Perplexity, Figma, Canva, Higgsfield, CapCut, and more.
            </p>
          </div>
          <Link href="/courses" className="text-sm font-medium text-primary hover:underline shrink-0">
            Browse all
          </Link>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mastersCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Recommended courses
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fresh picks to keep your momentum going.
            </p>
          </div>
          <Link href="/courses" className="text-sm font-medium text-primary hover:underline shrink-0">
            Browse all
          </Link>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommended.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        Looking for path, study lab, notes, or certificates?{' '}
        <Link href="/learn/path" className="text-primary hover:underline">
          Open adaptive path
        </Link>
        {' · '}
        <Link href="/learn/study" className="text-primary hover:underline">
          Study Lab
        </Link>
      </p>
    </div>
  );
}
