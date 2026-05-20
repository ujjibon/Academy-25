'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { InstructorDashboardHero } from '@/components/dashboard/InstructorDashboardHero';
import { InstructorTeachingTools } from '@/components/instructor/InstructorTeachingTools';
import { InstructorAiAssistantBanner } from '@/components/instructor/InstructorAiAssistantBanner';
import { PlatformFeaturesGrid } from '@/components/platform/PlatformFeaturesGrid';
import { getInstructorCourses } from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, Users, ClipboardList, Pencil } from 'lucide-react';

function InstructorDashboardContent() {
  const searchParams = useSearchParams();
  const editCourseId = searchParams.get('edit');
  const { user, userProfile } = useAuth();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getInstructorCourses(user.uid);
      setCourses(list);
    } catch {
      setError('Could not load your courses. Check your connection and try again.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const totalStudents = courses.reduce(
    (sum, c) => sum + c.enrolledStudentIds.filter((id) => id !== c.instructorId).length,
    0
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <InstructorDashboardHero
        displayName={userProfile?.displayName || user?.displayName || 'Instructor'}
        courseCount={courses.length}
        studentCount={totalStudents}
      />

      <InstructorAiAssistantBanner />

      <section className="dashboard-panel p-6 space-y-4">
        <header>
          <span className="dashboard-kicker">Platform</span>
          <h2 className="font-heading text-xl font-semibold tracking-tight mt-3">
            All instructor tools
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Course builder, assignments, drip, commerce, analytics, and more.
          </p>
        </header>
        <PlatformFeaturesGrid role="instructor" />
      </section>

      <InstructorTeachingTools
        courses={courses}
        onCoursesChange={load}
        initialEditCourseId={editCourseId}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load courses</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Courses" value={String(courses.length)} />
        <StatCard icon={Users} label="Students" value={String(totalStudents)} />
        <StatCard icon={ClipboardList} label="Active classes" value={String(courses.length)} />
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Your courses</h2>
        {courses.length === 0 ? (
          <Card className="brand-card p-6 text-center text-muted-foreground">
            Create your first course to get started.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.id} className="brand-card">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">Code: {course.classCode}</p>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  <Button size="sm" asChild className="brand-button">
                    <Link href={`/instructor/course-builder?edit=${course.id}`}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit course
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/instructor/courses/${course.id}`}>Analytics</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/instructor/gradebook?course=${course.id}`}>Gradebook</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/classroom/${course.id}/stream`}>Live class</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/classroom/${course.id}/classwork`}>Assignments</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="brand-card">
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 text-primary mb-2" />
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function InstructorDashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <InstructorDashboardContent />
    </Suspense>
  );
}
