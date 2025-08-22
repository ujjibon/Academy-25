import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/lib/firebase';
import { TrendingUp, Star, Flame } from 'lucide-react';

interface StatsProps {
  userProfile: UserProfile;
}

export function Stats({ userProfile }: StatsProps) {
  const stats = [
    { title: 'XP Points', value: userProfile.xp.toLocaleString(), icon: <Star className="h-6 w-6 text-muted-foreground" /> },
    { title: 'Current Level', value: userProfile.level, icon: <TrendingUp className="h-6 w-6 text-muted-foreground" /> },
    { title: 'Daily Streak', value: `${userProfile.dailyStreak} days`, icon: <Flame className="h-6 w-6 text-muted-foreground" /> },
  ];

  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
            {stat.title === 'Daily Streak' && userProfile.dailyStreak > 0 && (
              <div className="text-xs text-orange-500 font-medium">🔥</div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
