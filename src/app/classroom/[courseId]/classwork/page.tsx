'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ClipboardList, Loader2, Plus } from 'lucide-react';
import { getCourseAssignments, createAssignment } from '@/lib/classroom-service';
import type { ClassroomAssignment } from '@/lib/classroom-types';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassworkPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage = isInstructorOrAdmin(userProfile, user?.email);

  const load = () => {
    getCourseAssignments(courseId)
      .then(setAssignments)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [courseId]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <ClassworkHeader canManage={canManage} courseId={courseId} onCreated={load} />
      {assignments.length === 0 ? (
        <Card className="brand-card p-8 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
          No assignments yet.
        </Card>
      ) : (
        assignments.map((a) => (
          <Card key={a.id} className="brand-card hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{a.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Due {format(a.deadline, 'MMM d, yyyy')} · {a.points} pts
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-2 mb-4">{a.description}</p>
              <Button asChild variant="outline" size="sm">
                <Link href={`/classroom/${courseId}/assignments/${a.id}`}>View assignment</Link>
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ClassworkHeader({
  canManage,
  courseId,
  onCreated,
}: {
  canManage: boolean;
  courseId: string;
  onCreated: () => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="font-heading text-xl font-semibold">Classwork</h2>
      {canManage && <CreateAssignmentDialog courseId={courseId} onCreated={onCreated} />}
    </div>
  );
}

function CreateAssignmentDialog({
  courseId,
  onCreated,
}: {
  courseId: string;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [points, setPoints] = useState('100');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !title.trim() || !deadline) return;
    setLoading(true);
    try {
      await createAssignment({
        courseId,
        title: title.trim(),
        description: description.trim(),
        deadline: new Date(deadline),
        points: parseInt(points, 10) || 100,
        createdBy: user.uid,
      });
      toast({ title: 'Assignment created' });
      setOpen(false);
      onCreated();
    } catch {
      toast({ title: 'Failed to create', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="brand-button">
          <Plus className="mr-2 h-4 w-4" /> Add assignment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Points</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full brand-button">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
