'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search as SearchIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { searchLearningCatalog } from '@/lib/learning-engine';
import { Input } from '@/components/ui/input';

export function LearningSearchPageContent() {
  const { userProfile } = useAuth();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);

  const hits = useMemo(
    () => searchLearningCatalog(deferred, userProfile?.courseProgress || {}),
    [deferred, userProfile?.courseProgress]
  );

  return (
    <div className="page-stack max-w-3xl">
      <header className="space-y-3">
        <span className="dashboard-kicker inline-flex items-center gap-2">
          <SearchIcon className="h-3.5 w-3.5" />
          Learning search
        </span>
        <h1 className="page-title">Find any lesson in seconds</h1>
        <p className="text-muted-foreground">
          Search titles, objectives, and takeaways across the full Peer Academy catalog.
        </p>
      </header>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try React, prompt, Figma, Python…"
          className="pl-10 h-12 text-base"
          autoFocus
        />
      </div>

      {deferred.trim() ? (
        <ul className="space-y-2">
          {hits.length === 0 ? (
            <li className="dashboard-panel p-6 text-sm text-muted-foreground text-center">
              No matches for “{deferred}”.
            </li>
          ) : (
            hits.map((hit) => (
              <li key={`${hit.type}-${hit.courseId}-${hit.lessonId || 'course'}`}>
                <Link
                  href={hit.href}
                  className="dashboard-panel flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{hit.title}</p>
                      <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                        {hit.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {hit.subtitle}
                    </p>
                    {typeof hit.progress === 'number' && hit.progress > 0 ? (
                      <p className="text-xs text-primary mt-1">{Math.round(hit.progress)}% progress</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : (
        <div className="dashboard-panel p-6 text-sm text-muted-foreground">
          Start typing to search courses and lessons.
        </div>
      )}
    </div>
  );
}
