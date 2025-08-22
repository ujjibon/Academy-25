import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserProfile } from '@/lib/firebase';
import { Target, TrendingUp } from 'lucide-react';

interface WeeklyGoalsProps {
  userProfile: UserProfile;
}

export function WeeklyGoals({ userProfile }: WeeklyGoalsProps) {
  const weeklyGoal = 100; // Default weekly goal
  const currentProgress = userProfile.weeklyProgress || 0;
  const progressPercentage = Math.min((currentProgress / weeklyGoal) * 100, 100);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Weekly Goal
        </CardTitle>
        <CardDescription>Your progress for this week.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentProgress}/{weeklyGoal} XP
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {progressPercentage >= 100 ? '🎉 Goal achieved!' : `${Math.round(progressPercentage)}% of your goal`}
            </p>
            <p className="text-xs text-muted-foreground">
              {progressPercentage >= 100 
                ? 'Amazing work! You\'ve hit your weekly target.' 
                : 'Keep up the great work to build your streak!'
              }
            </p>
          </div>
          {userProfile.dailyStreak > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <TrendingUp className="h-4 w-4" />
              <span>{userProfile.dailyStreak} day streak!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
