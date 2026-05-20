'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  getStartupIdeasByOwner,
  getPitchDecksByOwner,
  getBookingsByUser,
} from '@/lib/startup-service';
import { Lightbulb, Presentation, CalendarClock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tiles = [
  {
    href: '/startup/ideas',
    title: 'Ideas',
    description: 'Submit and manage your startup ideas from draft to review.',
    icon: Lightbulb,
    statKey: 'ideas' as const,
  },
  {
    href: '/startup/pitch-deck',
    title: 'Pitch deck',
    description: 'Upload or link a deck and track review feedback.',
    icon: Presentation,
    statKey: 'decks' as const,
  },
  {
    href: '/startup/mentorship',
    title: 'Mentorship',
    description: 'Book sessions with mentors and prepare for each call.',
    icon: CalendarClock,
    statKey: 'bookings' as const,
  },
  {
    href: '/startup/ai-tools',
    title: 'Founder AI',
    description: 'AI-assisted writing, pitch prep, and Q&A practice.',
    icon: Sparkles,
    statKey: null,
  },
] as const;

export default function StartupDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ ideas: 0, decks: 0, bookings: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getStartupIdeasByOwner(user.uid),
      getPitchDecksByOwner(user.uid),
      getBookingsByUser(user.uid),
    ]).then(([ideas, decks, bookings]) => {
      setStats({
        ideas: ideas.length,
        decks: decks.length,
        bookings: bookings.filter((b) => b.status === 'scheduled').length,
      });
    });
  }, [user]);

  return (
    <div className="space-y-8 max-w-6xl">
      <section className="dashboard-panel p-6 md:p-8">
        <span className="dashboard-kicker">Incubation & acceleration</span>
        <h1 className="font-dashboard-title mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Startup hub
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
          A dedicated space for founders: idea pipeline, pitch reviews, mentorship, and AI tools.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map(({ href, title, description, icon: Icon, statKey }) => (
          <Link
            key={href}
            href={href}
            className="dashboard-panel group flex flex-col p-6 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg border border-border bg-background-elevated/80 p-2.5">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <h2 className="font-heading mt-4 text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
            {statKey ? (
              <p className="text-xs font-medium text-primary mt-3">
                {statKey === 'ideas' && `${stats.ideas} idea${stats.ideas !== 1 ? 's' : ''}`}
                {statKey === 'decks' && `${stats.decks} submission${stats.decks !== 1 ? 's' : ''}`}
                {statKey === 'bookings' &&
                  `${stats.bookings} upcoming session${stats.bookings !== 1 ? 's' : ''}`}
              </p>
            ) : null}
            <Button variant="outline" size="sm" className="mt-4 w-fit pointer-events-none" tabIndex={-1}>
              Open
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
