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
import { getAllUsers, resetUserProgress, setUserRole, editAdminUser, removeAdminUserProfile, type UserProfile } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { isAdminProfile, normalizeRole } from '@/lib/admin';
import { Loader2, Shield, Pencil, Trash2, RotateCcw } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [removing, setRemoving] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'learner' | 'instructor' | 'admin'>('learner');
  const [saving, setSaving] = useState(false);
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

  const saveUser = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await editAdminUser(editing.uid, { displayName: name, role });
      setUsers((existing) => existing.map((u) => u.uid === editing.uid ? { ...u, displayName: name.trim(), role } : u));
      if (editing.uid === currentUser?.uid) await refreshProfile();
      setEditing(null);
      toast({ title: 'User updated' });
    } catch (error) {
      toast({ title: 'Could not update user', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const removeUser = async () => {
    if (!removing || saving) return;
    setSaving(true);
    try {
      await removeAdminUserProfile(removing.uid);
      setUsers((existing) => existing.filter((u) => u.uid !== removing.uid));
      setRemoving(null);
      toast({ title: 'User profile removed' });
    } catch (error) {
      toast({ title: 'Could not remove user', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

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
          <CardTitle>All users</CardTitle>
          <CardDescription>
            Edit user details, manage roles, remove profiles, or reset learning progress.
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
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => {
                              setEditing(u); setName(u.displayName); setRole(isAdminProfile(u) ? 'admin' : normalizeRole(u.role));
                            }}>
                              <Pencil className="mr-1 h-3 w-3" />Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={saving || u.uid === currentUser?.uid} onClick={() => setRemoving(u)}>
                              <Trash2 className="mr-1 h-3 w-3" />Remove
                            </Button>
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
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open && !saving) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit user</DialogTitle><DialogDescription>Update the user’s name and role. Login email: {editing?.email}</DialogDescription></DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); void saveUser(); }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="user-name">Name</Label><Input id="user-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} disabled={saving} /></div>
            <div className="space-y-2"><Label htmlFor="user-role">Role</Label>
              <select id="user-role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value as typeof role)} disabled={saving || editing?.uid === currentUser?.uid}>
                <option value="learner">Learner</option><option value="instructor">Instructor</option><option value="admin">Admin</option>
              </select>
            </div>
            <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save changes'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!removing} onOpenChange={(open) => { if (!open && !saving) setRemoving(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove {removing?.displayName}?</AlertDialogTitle><AlertDialogDescription>This permanently deletes this user’s profile and learning progress from the Users list. Their Firebase sign-in account and separately stored records remain. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={saving} onClick={(event) => { event.preventDefault(); void removeUser(); }}>{saving ? 'Removing…' : 'Remove profile'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
