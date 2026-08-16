'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BookMarked,
  Compass,
  Flame,
  Map,
  NotebookPen,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getLearningPulse, type LearningPulse } from '@/lib/learning-engine';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const toolLinks = [
  {
    href: '/learn/path',
    label: 'Adaptive Path',
    description: 'Living curriculum from your gaps',
    icon: Map,
  },
  {
    href: '/learn/study',
    label: 'Study Lab',
    description: 'Spaced repetition reviews',
    icon: BookMarked,
  },
  {
    href: '/learn/notes',
    label: 'Notes Vault',
    description: 'Capture what stuck',
    icon: NotebookPen,
  },
  {
    href: '/learn/search',
    label: 'Search',
    description: 'Find any lesson instantly',
    icon: Search,
  },
] as const;

export function DynamicLearningHub() {
  const { userProfile } = useAuth();
  const [pulse, setPulse] = useState<LearningPulse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;
    setLoading(true);
    getLearningPulse(userProfile)
      .then((data) => {
        if (!cancelled) setPulse(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userProfile]);

  if (!userProfile) return null;

  if (loading && !pulse) {
    return <Skeleton className="h-56 w-full rounded-[var(--radius)]" />;
  }

  const missions = pulse?.missions ?? [];
  const path = pulse?.path;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Dynamic Learning OS
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight mt-1">
            {path?.headline || 'Your living learning loop'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Adaptive path, spaced reviews, notes, and search — one loop that adapts as you learn.
          </p>
        </div>
        {pulse?.continueHref ? (
          <Link href={pulse.continueHref} className="brand-button inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Continue learning
          </Link>
        ) : (
          <Link href="/courses" className="brand-button inline-flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Explore courses
          </Link>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="dashboard-panel p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Today&apos;s missions</p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              {path?.estimatedMinutesToday ?? 0} min planned
            </span>
          </div>
          <ul className="space-y-2">
            {missions.map((m) => (
              <li key={m.id}>
                <Link
                  href={m.href}
                  className={cn(
                    'flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/40',
                    m.done && 'opacity-60'
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {m.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary">+{m.xpReward} XP</span>
                </Link>
              </li>
            ))}
          </ul>
          {path?.focusAreas?.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {path.focusAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {area}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="dashboard-panel p-5 flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Learning pulse</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pulse?.dueReviews ?? 0} reviews due · {pulse?.notesCount ?? 0} notes ·{' '}
                {path?.completionRate ?? 0}% catalog complete
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {toolLinks.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="dashboard-panel p-4 hover:bg-muted/30 transition-colors"
              >
                <tool.icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-sm font-semibold leading-tight">{tool.label}</p>
                <p className="text-[0.7rem] text-muted-foreground mt-1 leading-snug">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
