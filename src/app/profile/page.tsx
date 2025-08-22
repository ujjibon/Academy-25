'use client';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Flame, GitMerge, MessageSquare, Star, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: { [key: string]: React.ElementType } = {
    Award,
    Flame,
    Star,
    GitMerge,
    MessageSquare,
    Users
};

export default function ProfilePage() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="text-center sm:text-left space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Skeleton className="h-64" />
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
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.photoURL || ''} alt={userProfile.displayName} />
                <AvatarFallback>{userProfile.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold">{userProfile.displayName}</h1>
                <p className="text-muted-foreground">{userProfile.email}</p>
                <div className="mt-4 flex flex-wrap gap-4 justify-center sm:justify-start">
                    <Badge variant="secondary" className="text-base">Level {userProfile.level}</Badge>
                    <Badge variant="secondary" className="text-base">{userProfile.xp.toLocaleString()} XP</Badge>
                    <Badge variant="secondary" className="text-base flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" /> {userProfile.dailyStreak} Day Streak
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
                {userProfile.badges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No badges earned yet</p>
                    <p className="text-sm">Complete lessons and challenges to earn badges!</p>
                  </div>
                ) : (
                  <TooltipProvider>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                          {userProfile.badges.map((badge, index) => {
                               const Icon = iconMap[badge.icon] || Award;
                               return (
                                  <Tooltip key={`${badge.name}-${index}`}>
                                      <TooltipTrigger asChild>
                                          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 border transition-colors hover:bg-accent">
                                              <Icon className="h-10 w-10 text-primary"/>
                                          </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p>{badge.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Earned {badge.earnedAt.toLocaleDateString()}
                                          </p>
                                      </TooltipContent>
                                  </Tooltip>
                               )
                          })}
                      </div>
                  </TooltipProvider>
                )}
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
