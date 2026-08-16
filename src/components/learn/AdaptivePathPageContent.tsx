'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Circle, Lock, Map, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { buildAdaptiveLearningPath } from '@/lib/learning-engine';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectionError } from '@/components/ui/connection-error';
import { cn } from '@/lib/utils';

export function AdaptivePathPageContent() {
  const { userProfile, loading, connectionError, retryConnection } = useAuth();

  const path = useMemo(
    () => (userProfile ? buildAdaptiveLearningPath(userProfile) : null),
    [userProfile]
  );

  if (loading) {
    return (
      <div className="page-stack max-w-4xl">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="page-stack max-w-4xl">
        <ConnectionError error={connectionError} onRetry={retryConnection} isLoading={loading} />
      </div>
    );
  }

  if (!userProfile || !path) {
    return (
      <div className="dashboard-panel p-8 text-center">
        <p className="text-muted-foreground">Sign in to unlock your adaptive learning path.</p>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-4xl">
      <header className="space-y-3">
        <span className="dashboard-kicker inline-flex items-center gap-2">
          <Map className="h-3.5 w-3.5" />
          Adaptive Path
        </span>
        <h1 className="page-title">{path.headline}</h1>
        <p className="text-muted-foreground max-w-2xl">
          A living curriculum that reorders around your strengths, weaknesses, and in-progress
          courses — not a static syllabus.
        </p>
      </header>

      <section className="dashboard-panel p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Focus this week</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {path.focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-3xl font-bold tracking-tight">{path.completionRate}%</p>
          <p className="text-xs text-muted-foreground">catalog mastery</p>
        </div>
      </section>

      {path.nextAction ? (
        <Link
          href={path.nextAction.href}
          className="cta-band-royal !flex-row items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              Next best action
            </p>
            <p className="font-heading text-lg font-semibold sm:text-xl">
              {path.nextAction.lessonTitle}
            </p>
            <p className="text-sm text-white/75">
              {path.nextAction.courseTitle} · ~{path.nextAction.estimatedMinutes} min
            </p>
          </div>
          <span className="cta-band-button shrink-0">
            Start
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ) : null}

      <ol className="space-y-3">
        {path.steps.map((step, index) => {
          const Icon =
            step.status === 'done'
              ? CheckCircle2
              : step.status === 'locked'
                ? Lock
                : step.status === 'current'
                  ? Sparkles
                  : Circle;
          return (
            <li key={step.id}>
              <Link
                href={step.status === 'locked' ? '#' : step.href}
                aria-disabled={step.status === 'locked'}
                className={cn(
                  'dashboard-panel flex gap-4 p-4 sm:p-5 transition-colors',
                  step.status === 'locked'
                    ? 'pointer-events-none opacity-55'
                    : 'hover:bg-muted/30',
                  step.status === 'current' && 'ring-1 ring-primary/30'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold',
                    step.status === 'current'
                      ? 'border-primary bg-primary/10 text-primary'
                      : step.status === 'done'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                        : 'border-border bg-muted/40 text-muted-foreground'
                  )}
                >
                  {step.status === 'done' || step.status === 'current' ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{step.lessonTitle}</p>
                    <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                      {step.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.courseTitle}</p>
                  <p className="text-xs text-muted-foreground mt-2">{step.reason}</p>
                  {step.progressPercent > 0 ? (
                    <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, step.progressPercent)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
                  ~{step.estimatedMinutes}m
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
