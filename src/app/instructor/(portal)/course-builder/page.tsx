'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorCourseBuilderPanel } from '@/components/platform/instructor-panels';
import { Skeleton } from '@/components/ui/skeleton';

function CourseBuilderContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  return (
    <InstructorCourseBuilderPanel
      key={editId ?? 'new'}
      initialEditCourseId={editId}
    />
  );
}

export default function InstructorCourseBuilderPage() {
  return (
    <FeaturePageShell featureId="course-builder">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <CourseBuilderContent />
      </Suspense>
    </FeaturePageShell>
  );
}
