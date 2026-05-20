'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorGradebookPanel } from '@/components/platform/instructor-panels';
import { Skeleton } from '@/components/ui/skeleton';

function GradebookContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course');
  return <InstructorGradebookPanel initialCourseId={courseId} />;
}

export default function InstructorGradebookPage() {
  return (
    <FeaturePageShell featureId="gradebook">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <GradebookContent />
      </Suspense>
    </FeaturePageShell>
  );
}
