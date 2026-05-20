'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { ClassroomHeader } from '@/components/classroom/ClassroomHeader';
import { ClassroomNav } from '@/components/classroom/ClassroomNav';
import { getClassroomCourse } from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { isAdminProfile } from '@/lib/admin';

export default function ClassroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { user, userProfile } = useAuth();
  const [course, setCourse] = useState<ClassroomCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClassroomCourse(courseId)
      .then((c) => setCourse(c))
      .finally(() => setLoading(false));
  }, [courseId]);

  const isTeachingThisCourse =
    !!course &&
    !!user &&
    (course.instructorId === user.uid || isAdminProfile(userProfile, user.email));

  const Shell = isTeachingThisCourse ? InstructorLayout : AppLayout;

  if (loading) {
    return (
      <Shell>
        <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
        <Skeleton className="h-10 w-full mt-4" />
      </Shell>
    );
  }

  if (!course) {
    notFound();
  }

  return (
    <Shell>
      <div className="space-y-6 max-w-5xl">
        <ClassroomHeader course={course} />
        <ClassroomNav courseId={courseId} />
        {children}
      </div>
    </Shell>
  );
}
