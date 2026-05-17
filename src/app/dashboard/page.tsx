'use client';

import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { DashboardWelcome } from '@/components/dashboard/DashboardWelcome';
import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards';
import { DashboardAiCoachBanner } from '@/components/dashboard/DashboardAiCoachBanner';
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals';
import { ActiveCourse } from '@/components/dashboard/ActiveCourse';
import { PersonalTrainer } from '@/components/dashboard/PersonalTrainer';
import { StrengthsWeaknessesChart } from '@/components/dashboard/StrengthsWeaknessesChart';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectionError } from '@/components/ui/connection-error';

export default function DashboardPage() {
  const { userProfile, loading, connectionError, retryConnection } = useAuth();

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-[var(--radius)]" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-36 rounded-[var(--radius)]" />
            <Skeleton className="h-36 rounded-[var(--radius)]" />
            <Skeleton className="h-36 rounded-[var(--radius)]" />
          </div>
          <Skeleton className="h-28 rounded-[var(--radius)]" />
        </div>
      </AppLayout>
    );
  }

  if (connectionError) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-6xl">
          <div className="dashboard-panel p-6">
            <h1 className="font-dashboard-title text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
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
      </AppLayout>
    );
  }

  if (!userProfile) {
    return (
      <AppLayout>
        <div className="dashboard-panel flex h-64 items-center justify-center">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-semibold mb-2">No profile found</h2>
            <p className="text-muted-foreground">Please log in to view your dashboard.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <DashboardWelcome userProfile={userProfile} />
        <DashboardStatCards userProfile={userProfile} />
        <DashboardAiCoachBanner userProfile={userProfile} />
        <ActiveCourse userProfile={userProfile} />

        <div className="grid gap-4 lg:grid-cols-2">
          <WeeklyGoals userProfile={userProfile} />
          <PersonalTrainer userProfile={userProfile} />
        </div>

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
    </AppLayout>
  );
}

