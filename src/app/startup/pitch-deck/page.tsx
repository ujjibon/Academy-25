'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  createPitchDeck,
  getPitchDecksByOwner,
  getStartupIdeasByOwner,
} from '@/lib/startup-service';
import type { StartupIdea, StartupPitchDeck } from '@/lib/startup-types';
import { PITCH_STATUS_LABELS } from '@/lib/startup-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function PitchDeckPageInner() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const prefillIdeaId = searchParams.get('ideaId');
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [decks, setDecks] = useState<StartupPitchDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ideaId, setIdeaId] = useState(prefillIdeaId || '');
  const [title, setTitle] = useState('');
  const [deckUrl, setDeckUrl] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([getStartupIdeasByOwner(user.uid), getPitchDecksByOwner(user.uid)])
      .then(([i, d]) => {
        setIdeas(i);
        setDecks(d);
        if (prefillIdeaId && i.some((x) => x.id === prefillIdeaId)) setIdeaId(prefillIdeaId);
        else if (i.length === 1) setIdeaId(i[0].id);
      })
      .finally(() => setLoading(false));
  }, [user, prefillIdeaId]);

  const submit = async () => {
    if (!user || !ideaId || !title.trim() || !deckUrl.trim()) {
      toast({ title: 'Fill all fields', variant: 'destructive' });
      return;
    }
    const idea = ideas.find((i) => i.id === ideaId);
    setBusy(true);
    try {
      await createPitchDeck({
        ownerId: user.uid,
        ownerEmail: userProfile?.email || user.email || undefined,
        ownerName: userProfile?.displayName || user.displayName || undefined,
        ideaId,
        ideaTitle: idea?.title,
        title,
        deckUrl,
        status: 'submitted',
      });
      toast({ title: 'Pitch deck submitted for review' });
      setTitle('');
      setDeckUrl('');
      const d = await getPitchDecksByOwner(user.uid);
      setDecks(d);
    } catch {
      toast({ title: 'Error', description: 'Could not submit.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <section className="dashboard-panel p-6">
        <span className="dashboard-kicker">Pitch</span>
        <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight">Pitch deck hub</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Link to your deck (Google Slides, Canva, PDF URL, etc.). Admins will review and leave notes.
        </p>
      </section>

      {ideas.length === 0 ? (
        <section className="dashboard-panel p-6 text-sm text-muted-foreground">
          <Link href="/startup/ideas/new" className="text-primary hover:underline">
            Create an idea
          </Link>{' '}
          before submitting a pitch deck.
        </section>
      ) : (
        <section className="dashboard-panel p-6 space-y-4">
          <div className="space-y-2">
            <Label>Idea</Label>
            <Select value={ideaId} onValueChange={setIdeaId}>
              <SelectTrigger>
                <SelectValue placeholder="Select idea" />
              </SelectTrigger>
              <SelectContent>
                {ideas.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deck title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Deck URL</Label>
            <Input value={deckUrl} onChange={(e) => setDeckUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button className="brand-button" disabled={busy} onClick={submit}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit for review'}
          </Button>
        </section>
      )}

      <section className="dashboard-panel p-6">
        <h3 className="font-semibold">Your submissions</h3>
        {decks.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">None yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {decks.map((d) => (
              <li key={d.id} className="border border-border rounded-lg p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{d.title}</span>
                  <Badge variant="outline">{PITCH_STATUS_LABELS[d.status]}</Badge>
                </div>
                {d.ideaTitle ? (
                  <p className="text-muted-foreground mt-1">Idea: {d.ideaTitle}</p>
                ) : null}
                {d.reviewerNotes ? (
                  <p className="mt-2 text-muted-foreground border-t pt-2">
                    <span className="font-medium text-foreground">Reviewer: </span>
                    {d.reviewerNotes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function StartupPitchDeckPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PitchDeckPageInner />
    </Suspense>
  );
}
