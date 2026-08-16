'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, NotebookPen, Save } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getLessonNote, upsertLessonNote } from '@/lib/learning-engine';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type Props = {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
};

export function LessonNotesPanel({ courseId, lessonId, courseTitle, lessonTitle }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const note = await getLessonNote(user.uid, courseId, lessonId);
      setBody(note?.body || '');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, courseId, lessonId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const save = async () => {
    if (!user) {
      toast({ title: 'Sign in to save notes', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await upsertLessonNote({
        userId: user.uid,
        courseId,
        lessonId,
        courseTitle,
        lessonTitle,
        body,
      });
      toast({ title: 'Note saved' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not save note', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <NotebookPen className="h-4 w-4" />
        Lesson notes
      </Button>
    );
  }

  return (
    <div className="dashboard-panel p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold inline-flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-primary" />
          Lesson notes
        </p>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : (
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Capture insights, questions, and examples…"
          rows={5}
          className="resize-y min-h-[120px]"
        />
      )}
      <div className="flex justify-end gap-2">
        {!user ? (
          <Button size="sm" variant="outline" asChild>
            <a href={`/login?redirect=${encodeURIComponent(`/courses/${courseId}/${lessonId}`)}`}>
              Sign in to save
            </a>
          </Button>
        ) : null}
        <Button size="sm" onClick={() => void save()} disabled={saving || loading || !user}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save note
        </Button>
      </div>
    </div>
  );
}
