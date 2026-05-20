'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import {
  CODE_LANGUAGE_LABELS,
  defaultStarterForLanguage,
} from '@/lib/programming-course';
import type { CodeLanguage } from '@/lib/data-provider';
import type { AssignmentSubmissionType } from '@/lib/classroom-types';
import { createAssignment } from '@/lib/classroom-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type Props = {
  courseId: string;
  onCreated?: () => void;
  triggerLabel?: string;
};

export function CreateAssignmentDialog({
  courseId,
  onCreated,
  triggerLabel = 'Add assignment',
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [points, setPoints] = useState('100');
  const [submissionType, setSubmissionType] =
    useState<AssignmentSubmissionType>('standard');
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('javascript');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setPoints('100');
    setSubmissionType('standard');
  };

  const handleCreate = async () => {
    if (!user || !title.trim() || !deadline) {
      toast({ title: 'Title and due date are required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await createAssignment({
        courseId,
        title: title.trim(),
        description: description.trim(),
        deadline: new Date(deadline),
        points: parseInt(points, 10) || 100,
        submissionType,
        codeLanguage: submissionType === 'code' ? codeLanguage : undefined,
        starterCode:
          submissionType === 'code'
            ? defaultStarterForLanguage(codeLanguage)
            : undefined,
        createdBy: user.uid,
      });
      toast({ title: 'Assignment created' });
      setOpen(false);
      reset();
      onCreated?.();
    } catch (e) {
      toast({
        title: 'Failed to create',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="brand-button">
          <Plus className="mr-2 h-4 w-4" /> {triggerLabel}
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
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Points</Label>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Submission type</Label>
            <Select
              value={submissionType}
              onValueChange={(v) => setSubmissionType(v as AssignmentSubmissionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Written response</SelectItem>
                <SelectItem value="code">Code editor (programming)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {submissionType === 'code' && (
            <div className="space-y-2">
              <Label>Programming language</Label>
              <Select
                value={codeLanguage}
                onValueChange={(v) => setCodeLanguage(v as CodeLanguage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CODE_LANGUAGE_LABELS) as CodeLanguage[]).map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {CODE_LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleCreate} disabled={loading} className="w-full brand-button">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
