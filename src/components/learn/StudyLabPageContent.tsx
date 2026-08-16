'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookMarked, Check, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { addXP } from '@/lib/firebase';
import { getCourse } from '@/lib/data-provider';
import { courses as catalog } from '@/lib/courses';
import {
  importLessonStudyCards,
  listDueStudyCards,
  listStudyCards,
  reviewStudyCard,
  type StudyCard,
} from '@/lib/learning-engine';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function StudyLabPageContent() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [due, setDue] = useState<StudyCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importCourseId, setImportCourseId] = useState(catalog[0]?.id || '');
  const [importing, setImporting] = useState(false);

  const current = due[0] || null;

  const courseOptions = useMemo(
    () =>
      catalog.map((c) => ({
        id: c.id,
        title: c.title,
        lessons: getCourse(c.id)?.lessons || [],
      })),
    []
  );

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dueCards, all] = await Promise.all([
        listDueStudyCards(user.uid),
        listStudyCards(user.uid),
      ]);
      setDue(dueCards);
      setTotal(all.length);
      setFlipped(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Could not load Study Lab',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onRate = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!user || !current) return;
    setBusy(true);
    try {
      await reviewStudyCard(current.id, current, quality);
      if (quality >= 3) {
        await addXP(user.uid, 5);
        await refreshProfile();
      }
      setDue((prev) => prev.slice(1));
      setFlipped(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Review failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const onImportActive = async () => {
    if (!user || !importCourseId) return;
    const course = getCourse(importCourseId);
    if (!course) return;
    const progress = userProfile?.courseProgress?.[importCourseId] ?? 0;
    const idx = Math.min(
      course.lessons.length - 1,
      Math.max(0, Math.floor((progress / 100) * course.lessons.length))
    );
    const lesson =
      (userProfile?.activeCourseId === importCourseId &&
        course.lessons.find((l) => l.id === userProfile.activeLessonId)) ||
      course.lessons[idx] ||
      course.lessons[0];
    if (!lesson) return;

    setImporting(true);
    try {
      const added = await importLessonStudyCards(user.uid, course, lesson);
      toast({
        title: added > 0 ? `Added ${added} cards` : 'Cards already in your deck',
        description: `${course.title} · ${lesson.title}`,
      });
      await reload();
    } catch (error) {
      console.error(error);
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-panel p-8 text-center">
        <p className="text-muted-foreground">Sign in to use spaced repetition.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-stack max-w-3xl">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="page-stack max-w-3xl">
      <header className="space-y-3">
        <span className="dashboard-kicker inline-flex items-center gap-2">
          <BookMarked className="h-3.5 w-3.5" />
          Study Lab
        </span>
        <h1 className="page-title">Spaced repetition that sticks</h1>
        <p className="text-muted-foreground">
          Cards pull from lesson quizzes and takeaways. Rate each recall — harder cards return
          sooner.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="dashboard-panel p-4">
          <p className="text-xs text-muted-foreground">Due now</p>
          <p className="font-heading text-2xl font-bold">{due.length}</p>
        </div>
        <div className="dashboard-panel p-4">
          <p className="text-xs text-muted-foreground">Deck size</p>
          <p className="font-heading text-2xl font-bold">{total}</p>
        </div>
        <div className="dashboard-panel p-4">
          <p className="text-xs text-muted-foreground">Session XP</p>
          <p className="font-heading text-2xl font-bold">+5 / recall</p>
        </div>
      </div>

      <section className="dashboard-panel p-5 space-y-4">
        <p className="text-sm font-semibold">Import cards from a course</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={importCourseId} onValueChange={setImportCourseId}>
            <SelectTrigger className="sm:flex-1">
              <SelectValue placeholder="Choose course" />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => void onImportActive()} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Import current lesson
          </Button>
        </div>
      </section>

      {current ? (
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            className="dashboard-panel w-full min-h-[240px] p-8 text-left transition-colors hover:bg-muted/20"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              {flipped ? 'Answer' : 'Prompt'} · tap to flip
            </p>
            <p className="font-heading text-xl sm:text-2xl font-semibold leading-snug text-balance">
              {flipped ? current.back : current.front}
            </p>
          </button>

          {flipped ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button variant="outline" disabled={busy} onClick={() => void onRate(1)}>
                Again
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => void onRate(3)}>
                Hard
              </Button>
              <Button disabled={busy} onClick={() => void onRate(4)}>
                Good
              </Button>
              <Button className="brand-button-flare" disabled={busy} onClick={() => void onRate(5)}>
                <Check className="h-4 w-4 mr-1" />
                Easy
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setFlipped(true)}>
              Show answer
            </Button>
          )}
        </section>
      ) : (
        <section className="dashboard-panel p-8 text-center space-y-4">
          <RotateCcw className="h-8 w-8 mx-auto text-primary" />
          <h2 className="font-heading text-xl font-semibold">You&apos;re caught up</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No cards due right now. Import a lesson deck or keep learning — new cards unlock as you
            progress.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/learn/path">Open adaptive path</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
