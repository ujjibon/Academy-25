'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { ClassroomHeader } from '@/components/classroom/ClassroomHeader';
import { ClassroomNav } from '@/components/classroom/ClassroomNav';
import { getClassroomCourse } from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<ClassroomCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClassroomCourse(courseId)
      .then((c) => setCourse(c))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <AppLayout>
        <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-10 w-full mt-4" />
      </AppLayout>
    );
  }

  if (!course) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <ClassroomHeader course={course} />
        <ClassroomNav courseId={courseId} />
        {children}
      </div>
    </AppLayout>
  );
}
