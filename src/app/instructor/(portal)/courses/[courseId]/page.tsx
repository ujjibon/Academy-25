'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getClassroomCourseForInstructor } from '@/lib/instructor-course-access';
import { InstructorCourseInsights } from '@/components/instructor/InstructorCourseInsights';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { INSTRUCTOR_DASHBOARD } from '@/lib/role-routes';

export default function InstructorCourseInsightsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<ClassroomCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    getClassroomCourseForInstructor(courseId, user.uid, user.email)
      .then((c) => {
        if (!c) {
          setDenied(true);
          setCourse(null);
        } else {
          setDenied(false);
          setCourse(c);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (denied || !course) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-12">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold">Course not available</h2>
        <p className="text-muted-foreground text-sm">
          You can only view analytics for courses you teach. Other instructors&apos; classrooms
          are not visible here.
        </p>
        <Button asChild variant="outline">
          <Link href={INSTRUCTOR_DASHBOARD}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href={INSTRUCTOR_DASHBOARD}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Link>
      </Button>
      <InstructorCourseInsights course={course} />
    </div>
  );
}
