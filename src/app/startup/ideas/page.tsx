'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getStartupIdeasByOwner } from '@/lib/startup-service';
import type { StartupIdea } from '@/lib/startup-types';
import { IDEA_STATUS_LABELS } from '@/lib/startup-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function StartupIdeasPage() {
  const { user, userProfile } = useAuth();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getStartupIdeasByOwner(user.uid)
      .then(setIdeas)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-3xl space-y-6">
      <section className="dashboard-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="dashboard-kicker">Ideas</span>
          <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight">Idea portfolio</h2>
        </div>
        <Button asChild>
          <Link href="/startup/ideas/new">New idea</Link>
        </Button>
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : ideas.length === 0 ? (
        <section className="dashboard-panel p-8 text-center text-muted-foreground text-sm">
          No ideas yet. Create your first submission.
        </section>
      ) : (
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Link
                href={`/startup/ideas/${idea.id}`}
                className="dashboard-panel block p-5 hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{idea.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {idea.stage} · {format(idea.updatedAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline">{IDEA_STATUS_LABELS[idea.status]}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
