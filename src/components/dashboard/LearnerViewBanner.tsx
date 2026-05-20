'use client';

import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INSTRUCTOR_DASHBOARD } from '@/lib/role-routes';

export function LearnerViewBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Learner preview</p>
          <p className="text-sm text-muted-foreground">
            You&apos;re viewing the student learning dashboard. Your teaching tools live in the
            instructor portal.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="brand-button shrink-0">
        <Link href={INSTRUCTOR_DASHBOARD}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to instructor dashboard
        </Link>
      </Button>
    </div>
  );
}
