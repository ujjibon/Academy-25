'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  canAccessLearnerDashboard,
  getPostAuthRedirect,
  isLearnerPreviewView,
} from '@/lib/role-routes';
import { LearnerViewBanner } from '@/components/dashboard/LearnerViewBanner';
import { DashboardWelcome } from '@/components/dashboard/DashboardWelcome';
import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards';
import { DashboardAiCoachBanner } from '@/components/dashboard/DashboardAiCoachBanner';
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals';
import { ActiveCourse } from '@/components/dashboard/ActiveCourse';
import { PersonalTrainer } from '@/components/dashboard/PersonalTrainer';
import { StrengthsWeaknessesChart } from '@/components/dashboard/StrengthsWeaknessesChart';
import { UpcomingAssignments } from '@/components/dashboard/UpcomingAssignments';
import { PlatformFeaturesGrid } from '@/components/platform/PlatformFeaturesGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectionError } from '@/components/ui/connection-error';

export function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading, connectionError, retryConnection, isInstructor } =
    useAuth();
  const learnerPreview = isLearnerPreviewView(searchParams);

  useEffect(() => {
    if (loading || !user || !userProfile) return;
    if (canAccessLearnerDashboard(userProfile, user.email, learnerPreview)) return;
    router.replace(getPostAuthRedirect(userProfile, user.email));
  }, [user, userProfile, loading, learnerPreview, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-[var(--radius)]" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-36 rounded-[var(--radius)]" />
          <Skeleton className="h-36 rounded-[var(--radius)]" />
          <Skeleton className="h-36 rounded-[var(--radius)]" />
        </div>
        <Skeleton className="h-28 rounded-[var(--radius)]" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="dashboard-panel p-6">
          <h1 className="font-dashboard-title text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            We&apos;re having trouble connecting to your data.
          </p>
        </div>
        <ConnectionError
          error={connectionError}
          onRetry={retryConnection}
          isLoading={loading}
        />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="dashboard-panel flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-semibold mb-2">No profile found</h2>
          <p className="text-muted-foreground">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {isInstructor && learnerPreview ? <LearnerViewBanner /> : null}
      <DashboardWelcome userProfile={userProfile} />
      <DashboardStatCards userProfile={userProfile} />
      <DashboardAiCoachBanner userProfile={userProfile} />

      <section className="dashboard-panel p-6 space-y-4">
        <header>
          <span className="dashboard-kicker">Platform</span>
          <h2 className="font-heading text-xl font-semibold tracking-tight mt-3">
            Learning tools
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Assignments, live classes, gradebook, bundles, and more.
          </p>
        </header>
        <PlatformFeaturesGrid role="learner" />
        <Link href="/learn" className="text-sm text-primary hover:underline inline-block">
          View all tools →
        </Link>
      </section>

      <ActiveCourse userProfile={userProfile} />

      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyGoals userProfile={userProfile} />
        <PersonalTrainer userProfile={userProfile} />
      </div>

      <section className="dashboard-panel p-6">
        <header className="mb-4">
          <span className="dashboard-kicker">Classwork</span>
          <h2 className="font-heading text-xl font-semibold tracking-tight mt-3">
            Upcoming assignments
          </h2>
          <Link
            href="/learn/assignments"
            className="text-sm text-primary hover:underline mt-1 inline-block"
          >
            View all assignments →
          </Link>
        </header>
        <UpcomingAssignments userId={userProfile.uid} />
      </section>

      <section className="dashboard-panel p-6">
        <header className="mb-6">
          <span className="dashboard-kicker">Skills</span>
          <h2 className="font-heading text-xl font-semibold tracking-tight mt-3">
            Skill analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            A breakdown of your current skill levels.
          </p>
        </header>
        <StrengthsWeaknessesChart userProfile={userProfile} />
      </section>
    </div>
  );
}
