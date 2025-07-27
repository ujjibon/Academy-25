import AppLayout from '@/components/layout/AppLayout';
import { getLeaderboard } from '@/lib/data-provider';
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
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const leaderboard = getLeaderboard();
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
                {leaderboard.map((user, index) => (
                  <TableRow key={user.name} className={cn(user.isCurrentUser && 'bg-accent')}>
                    <TableCell className="font-medium text-lg">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50">
                            {index < 3 ? <Trophy className={cn("h-6 w-6", index === 0 && "text-yellow-500", index === 1 && "text-gray-400", index === 2 && "text-orange-400")} /> : user.rank}
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{user.xp.toLocaleString()}</TableCell>
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
