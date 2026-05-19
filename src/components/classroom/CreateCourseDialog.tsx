'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { createClassroomCourse } from '@/lib/classroom-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function CreateCourseDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleCreate = async () => {
    if (!user || !title.trim()) return;
    setLoading(true);
    try {
      const course = await createClassroomCourse({
        title: title.trim(),
        description: description.trim() || 'A new course on Peer Academy',
        coverImage: '/images/react-fundamentals.jpg',
        instructorId: user.uid,
        instructorName: userProfile?.displayName || 'Instructor',
      });
      toast({ title: 'Course created', description: `Class code: ${course.classCode}` });
      setOpen(false);
      setTitle('');
      setDescription('');
      onCreated?.();
      router.push(`/classroom/${course.id}/stream`);
    } catch {
      toast({ title: 'Error', description: 'Could not create course', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="brand-button">
          <Plus className="mr-2 h-4 w-4" />
          Create course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <DialogDescription>Set up a new classroom for your students.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <FormField id="title" label="Course title" value={title} onChange={setTitle} placeholder="React Development" />
          <FormField
            id="desc"
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="What will students learn?"
            multiline
          />
          <Button onClick={handleCreate} disabled={loading || !title.trim()} className="w-full brand-button">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create classroom
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}
