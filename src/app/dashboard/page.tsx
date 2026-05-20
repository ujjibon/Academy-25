'use client';

import { Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-36 rounded-[var(--radius)]" />
          </div>
        }
      >
        <DashboardPageContent />
      </Suspense>
    </AppLayout>
  );
}
