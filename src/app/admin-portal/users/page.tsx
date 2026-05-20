'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getAllUsers, resetUserProgress, setUserRole, type UserProfile } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { isAdminProfile, normalizeRole } from '@/lib/admin';
import { Loader2, Shield, ShieldOff, RotateCcw } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, refreshProfile } = useAuth();
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCycleRole = async (target: UserProfile) => {
    const current = target.role === 'admin' ? 'admin' : target.role === 'instructor' ? 'instructor' : 'learner';
    const next = current === 'learner' ? 'instructor' : current === 'instructor' ? 'admin' : 'learner';
    if (target.uid === currentUser?.uid && next !== 'admin' && current === 'admin') {
      toast({
        title: 'Not allowed',
        description: 'You cannot remove your own admin access.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await setUserRole(target.uid, next);
      toast({
        title: 'Role updated',
        description: `${target.displayName} is now ${next}.`,
      });
      if (target.uid === currentUser?.uid) {
        await refreshProfile();
      }
      await loadUsers();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update role.',
        variant: 'destructive',
      });
    }
  };

  const handleResetProgress = async (target: UserProfile) => {
    try {
      await resetUserProgress(target.uid);
      toast({
        title: 'Progress reset',
        description: `Reset progress for ${target.displayName}.`,
      });
      await loadUsers();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reset progress.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage learner accounts, roles, and progress.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All learners</CardTitle>
          <CardDescription>
            Promote users to admin or reset their learning progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isAdmin = isAdminProfile(u);
                    const roleLabel = normalizeRole(u.role);
                    return (
                      <TableRow key={u.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.photoURL} alt={u.displayName} />
                              <AvatarFallback>{u.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.displayName}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isAdmin ? 'default' : 'secondary'} className="capitalize">
                            {roleLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.level}</TableCell>
                        <TableCell>{u.xp?.toLocaleString()}</TableCell>
                        <TableCell>{u.dailyStreak} days</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCycleRole(u)}
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              Cycle role
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <RotateCcw className="mr-1 h-3 w-3" />
                                  Reset
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset progress?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reset XP, level, streak, and course progress for{' '}
                                    {u.displayName}. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResetProgress(u)}>
                                    Reset progress
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
