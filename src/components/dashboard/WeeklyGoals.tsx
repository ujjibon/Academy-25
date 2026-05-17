import Link from 'next/link';
import { ArrowUpRight, Target } from 'lucide-react';
import { UserProfile } from '@/lib/firebase';

interface WeeklyGoalsProps {
  userProfile: UserProfile;
}

export function WeeklyGoals({ userProfile }: WeeklyGoalsProps) {
  const weeklyGoal = 100;
  const currentProgress = userProfile.weeklyProgress || 0;
  const progressPercentage = Math.min((currentProgress / weeklyGoal) * 100, 100);
  const roadmapStages = 6;
  const completedStages = Math.min(
    roadmapStages,
    Math.floor(progressPercentage / (100 / roadmapStages))
  );

  return (
    <Link
      href="/profile"
      className="dashboard-panel relative flex h-full min-h-[11rem] flex-col p-6 group block hover:border-foreground/20 transition-colors"
    >
      <span className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-foreground">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Next best move</span>
      </div>
      <p className="font-dashboard-title text-3xl font-bold tracking-tight text-foreground">
        {completedStages} of {roadmapStages}
      </p>
      <p className="text-sm text-muted-foreground mt-1">roadmap stages complete</p>
      <div className="mt-auto pt-5 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Weekly XP goal</span>
          <span>
            {currentProgress}/{weeklyGoal}
          </span>
        </div>
        <div className="progress-brand">
          <div
            className="progress-brand-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
