'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getStartupIdea, getPitchDecksByIdea } from '@/lib/startup-service';
import type { StartupIdea, StartupPitchDeck } from '@/lib/startup-types';
import { IDEA_STATUS_LABELS, PITCH_STATUS_LABELS } from '@/lib/startup-types';
import { IdeaForm } from '@/components/startup/IdeaForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Props = { params: Promise<{ ideaId: string }> };

export default function StartupIdeaDetailPage({ params }: Props) {
  const { ideaId } = use(params);
  const { user, userProfile } = useAuth();
  const [idea, setIdea] = useState<StartupIdea | null>(null);
  const [decks, setDecks] = useState<StartupPitchDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    Promise.all([getStartupIdea(ideaId), getPitchDecksByIdea(ideaId)])
      .then(([i, d]) => {
        setIdea(i);
        setDecks(d);
      })
      .finally(() => setLoading(false));
  }, [ideaId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!idea || !user || idea.ownerId !== user.uid) {
    return (
      <section className="dashboard-panel p-6">
        <p className="text-muted-foreground">Idea not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/startup/ideas">All ideas</Link>
        </Button>
      </section>
    );
  }

  const canEdit = ['draft', 'needs_changes'].includes(idea.status);

  return (
    <div className="max-w-3xl space-y-6">
      <section className="dashboard-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="dashboard-kicker">Idea workspace</span>
            <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight">{idea.title}</h2>
            <Badge variant="outline" className="mt-2">
              {IDEA_STATUS_LABELS[idea.status]}
            </Badge>
          </div>
          <div className="flex gap-2">
            {canEdit && !editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/startup/ideas">All ideas</Link>
            </Button>
          </div>
        </div>
      </section>

      {editing && canEdit ? (
        <section className="dashboard-panel p-6">
          <IdeaForm
            userId={user.uid}
            userEmail={userProfile?.email}
            userName={userProfile?.displayName}
            idea={idea}
          />
        </section>
      ) : (
        <section className="dashboard-panel p-6 space-y-4 text-sm">
          {(
            [
              ['Problem', idea.problem],
              ['Solution', idea.solution],
              ['Market', idea.market],
              ['Traction', idea.traction],
              ['Team', idea.team],
              ['Ask', idea.ask],
            ] as const
          ).map(([label, text]) =>
            text ? (
              <div key={label}>
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{text}</p>
              </div>
            ) : null
          )}
        </section>
      )}

      <section className="dashboard-panel p-6">
        <h3 className="font-semibold">Linked pitch decks</h3>
        {decks.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {decks.map((d) => (
              <li key={d.id} className="flex justify-between text-sm border-b border-border/60 pb-2">
                <span>{d.title}</span>
                <Badge variant="outline">{PITCH_STATUS_LABELS[d.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={`/startup/pitch-deck?ideaId=${idea.id}`}>Submit pitch deck</Link>
        </Button>
      </section>
    </div>
  );
}
