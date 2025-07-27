import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getUser } from '@/lib/data-provider';

export function WeeklyGoals() {
  const user = getUser();
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Weekly Goal</CardTitle>
        <CardDescription>Your progress for this week.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            <p className="text-sm font-medium">Completed {user.weeklyProgress}% of your goal</p>
            <Progress value={user.weeklyProgress} />
            <p className="text-xs text-muted-foreground">Keep up the great work to build your streak!</p>
        </div>
      </CardContent>
    </Card>
  );
}
