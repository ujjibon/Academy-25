import AppLayout from '@/components/layout/AppLayout';
import { getUser } from '@/lib/data-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Flame, GitMerge, MessageSquare, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: { [key: string]: React.ElementType } = {
    Award,
    Flame,
    Star,
    GitMerge,
    MessageSquare,
    Users
};

export default function ProfilePage() {
  const user = getUser();
  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-4 flex flex-wrap gap-4 justify-center sm:justify-start">
                    <Badge variant="secondary" className="text-base">Level {user.level}</Badge>
                    <Badge variant="secondary" className="text-base">{user.xp.toLocaleString()} XP</Badge>
                    <Badge variant="secondary" className="text-base flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" /> {user.dailyStreak} Day Streak
                    </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Badges & Achievements</CardTitle>
                <CardDescription>Your collection of unlocked achievements.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {user.badges.map(badge => {
                             const Icon = iconMap[badge.icon] || Award;
                             return (
                                <Tooltip key={badge.name}>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 border transition-colors hover:bg-accent">
                                            <Icon className="h-10 w-10 text-primary"/>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{badge.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                             )
                        })}
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
