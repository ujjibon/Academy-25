import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser } from '@/lib/data-provider';
import { TrendingUp, Star, Flame } from 'lucide-react';

export function Stats() {
  const user = getUser();
  const stats = [
    { title: 'XP Points', value: user.xp.toLocaleString(), icon: <Star className="h-6 w-6 text-muted-foreground" /> },
    { title: 'Current Level', value: user.level, icon: <TrendingUp className="h-6 w-6 text-muted-foreground" /> },
    { title: 'Daily Streak', value: `${user.dailyStreak} days`, icon: <Flame className="h-6 w-6 text-muted-foreground" /> },
  ];

  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
