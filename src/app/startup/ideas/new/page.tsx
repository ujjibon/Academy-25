'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { IdeaForm } from '@/components/startup/IdeaForm';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function StartupNewIdeaPage() {
  const { user, userProfile, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <section className="dashboard-panel p-6">
        <span className="dashboard-kicker">New submission</span>
        <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight">Idea submission</h2>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/startup/ideas">Back to ideas</Link>
        </Button>
      </section>
      <section className="dashboard-panel p-6">
        <IdeaForm
          userId={user.uid}
          userEmail={userProfile?.email || user.email || undefined}
          userName={userProfile?.displayName || user.displayName || undefined}
        />
      </section>
    </div>
  );
}
