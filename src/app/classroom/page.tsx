'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { ClassroomHubContent } from '@/components/classroom/ClassroomHubContent';

function ClassroomHubFallback() {
  return (
    <AppLayout>
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );
}

export default function ClassroomHubPage() {
  return (
    <Suspense fallback={<ClassroomHubFallback />}>
      <ClassroomHubContent />
    </Suspense>
  );
}
