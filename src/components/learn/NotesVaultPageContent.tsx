'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Loader2, NotebookPen, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  deleteLessonNote,
  listLessonNotes,
  type LessonNote,
} from '@/lib/learning-engine';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function NotesVaultPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setNotes(await listLessonNotes(user.uid));
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not load notes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteLessonNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-panel p-8 text-center">
        <p className="text-muted-foreground">Sign in to open your notes vault.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-stack max-w-3xl">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="page-stack max-w-3xl">
      <header className="space-y-3">
        <span className="dashboard-kicker inline-flex items-center gap-2">
          <NotebookPen className="h-3.5 w-3.5" />
          Notes Vault
        </span>
        <h1 className="page-title">Everything you captured</h1>
        <p className="text-muted-foreground">
          Notes sync to your account from any lesson. Open a lesson to write or edit.
        </p>
      </header>

      {notes.length === 0 ? (
        <div className="dashboard-panel p-8 text-center space-y-3">
          <p className="text-muted-foreground">
            No notes yet. Open any lesson and use the Notes panel to capture ideas.
          </p>
          <Button asChild>
            <Link href="/learn/path">Go to adaptive path</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="dashboard-panel p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/courses/${note.courseId}/${note.lessonId}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {note.lessonTitle || 'Untitled lesson'}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {note.courseTitle} · updated {format(note.updatedAt, 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === note.id}
                  onClick={() => void onDelete(note.id)}
                  aria-label="Delete note"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/90 line-clamp-6">
                {note.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
