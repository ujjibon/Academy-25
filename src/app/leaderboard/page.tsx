'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { getLeaderboard } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Trophy, Loader2 } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  uid: string;
  name: string;
  xp: number;
  avatar: string;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        // Mark current user
        const leaderboardWithCurrentUser = data.map(entry => ({
          ...entry,
          isCurrentUser: entry.uid === user?.uid
        }));
        setLeaderboard(leaderboardWithCurrentUser);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user?.uid]);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-muted-foreground">
              See how you stack up against other learners.
            </p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading leaderboard...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you stack up against other learners.
          </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Top Learners</CardTitle>
                <CardDescription>Rankings are based on total XP earned.</CardDescription>
            </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((userEntry, index) => (
                  <TableRow key={userEntry.uid} className={cn(userEntry.isCurrentUser && 'bg-accent')}>
                    <TableCell className="font-medium text-lg">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50">
                            {index < 3 ? <Trophy className={cn("h-6 w-6", index === 0 && "text-yellow-500", index === 1 && "text-gray-400", index === 2 && "text-orange-400")} /> : userEntry.rank}
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={userEntry.avatar} alt={userEntry.name} />
                          <AvatarFallback>
                            {userEntry.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {userEntry.name}
                          {userEntry.isCurrentUser && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{userEntry.xp.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
