import AppLayout from '@/components/layout/AppLayout';
import { getUser } from '@/lib/data-provider';
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals';
import { ActiveCourse } from '@/components/dashboard/ActiveCourse';
import { Stats } from '@/components/dashboard/Stats';
import { StrengthsWeaknessesChart } from '@/components/dashboard/StrengthsWeaknessesChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PersonalTrainer } from '@/components/dashboard/PersonalTrainer';

export default function DashboardPage() {
  const user = getUser();
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s a snapshot of your learning journey today.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Stats />
          <PersonalTrainer />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ActiveCourse />
          </div>
          <div className="lg:col-span-2">
            <WeeklyGoals />
          </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Skill Analysis</CardTitle>
                <CardDescription>A breakdown of your current skill levels.</CardDescription>
            </CardHeader>
            <CardContent>
                <StrengthsWeaknessesChart />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
