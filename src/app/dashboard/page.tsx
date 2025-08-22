'use client';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals';
import { ActiveCourse } from '@/components/dashboard/ActiveCourse';
import { Stats } from '@/components/dashboard/Stats';
import { StrengthsWeaknessesChart } from '@/components/dashboard/StrengthsWeaknessesChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PersonalTrainer } from '@/components/dashboard/PersonalTrainer';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectionError } from '@/components/ui/connection-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Database } from 'lucide-react';

export default function DashboardPage() {
  const { userProfile, loading, connectionError, retryConnection, isFirebaseMode } = useAuth();

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Skeleton className="h-64" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-64" />
            </div>
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  if (connectionError) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              We're having trouble connecting to your data.
            </p>
          </div>
          <ConnectionError 
            error={connectionError} 
            onRetry={retryConnection}
            isLoading={loading}
          />
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Tips</CardTitle>
              <CardDescription>Try these steps to resolve the connection issue:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm">Check your internet connection</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm">Refresh the page</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm">Check if Firebase services are available</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm">Verify your Firebase configuration</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!userProfile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground">Please log in to view your dashboard.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">


        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userProfile.displayName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s a snapshot of your learning journey today.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Stats userProfile={userProfile} />
          <PersonalTrainer userProfile={userProfile} />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ActiveCourse userProfile={userProfile} />
          </div>
          <div className="lg:col-span-2">
            <WeeklyGoals userProfile={userProfile} />
          </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Skill Analysis</CardTitle>
                <CardDescription>A breakdown of your current skill levels.</CardDescription>
            </CardHeader>
            <CardContent>
                <StrengthsWeaknessesChart userProfile={userProfile} />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
