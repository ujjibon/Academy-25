'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { CreateCourseDialog } from '@/components/classroom/CreateCourseDialog';
import { useAuth } from '@/hooks/use-auth';
import { getInstructorCourses, getUserEnrolledCourses } from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { isLearnerPreviewView } from '@/lib/role-routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  ClipboardList,
  GraduationCap,
  Library,
  Loader2,
  Megaphone,
  PenSquare,
} from 'lucide-react';

export function ClassroomHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInstructor } = useAuth();
  const learnerPreview = isLearnerPreviewView(searchParams);
  const instructorHub = isInstructor && !learnerPreview;

  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = instructorHub
        ? await getInstructorCourses(user.uid)
        : await getUserEnrolledCourses(user.uid);
      setCourses(list);
    } finally {
      setLoading(false);
    }
  }, [user, instructorHub]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    loadCourses();
  }, [authLoading, user, loadCourses, router]);

  const Shell = instructorHub ? InstructorLayout : AppLayout;

  if (authLoading || (!user && !authLoading)) {
    return (
      <Shell>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8 max-w-6xl">
        <section className="dashboard-hero p-6 md:p-8">
          <span className="dashboard-kicker">Classroom</span>
          <h2 className="font-dashboard-title mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Classroom Hub
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {instructorHub
              ? 'Manage every class you teach. Open stream announcements, classwork, and student insights from one place.'
              : 'Access your classes in one place. Open stream announcements, classwork, and submissions quickly, similar to a classroom-first workflow.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {instructorHub ? (
              <>
                <CreateCourseDialog onCreated={loadCourses} />
                <Link
                  href="/instructor/platform"
                  className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  All platform tools
                </Link>
                <Link
                  href="/instructor/teach"
                  className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  <PenSquare className="h-4 w-4" />
                  Teach mode
                </Link>
              </>
            ) : (
              <>
                <Link href="/learn" className="brand-button text-sm inline-flex items-center px-4 py-2">
                  Learning tools
                </Link>
                <Link href="/courses" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50">
                  Browse courses
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            My classrooms
          </h3>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 rounded-[var(--radius)]" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card className="brand-card">
              <CardHeader>
                <CardTitle>No classrooms yet</CardTitle>
                <CardDescription>
                  {instructorHub
                    ? 'Create a classroom to start posting to the stream, assigning classwork, and tracking students.'
                    : 'Join a course to start seeing stream updates, classwork, and submissions.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {instructorHub ? (
                  <CreateCourseDialog onCreated={loadCourses} />
                ) : (
                  <Link href="/courses">
                    <Button>Go to courses</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="brand-card">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-base">{course.title}</CardTitle>
                    <CardDescription>Code: {course.classCode}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Link href={`/classroom/${course.id}/stream`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Megaphone className="mr-2 h-4 w-4" />
                          Stream
                        </Button>
                      </Link>
                      <Link href={`/classroom/${course.id}/classwork`} className="flex-1">
                        <Button className="w-full">
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Classwork
                        </Button>
                      </Link>
                    </div>
                    {instructorHub ? (
                      <>
                        <Button size="sm" variant="secondary" className="w-full" asChild>
                          <Link href={`/instructor/courses/${course.id}`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Analytics
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="w-full" asChild>
                          <Link href={`/instructor/gradebook?course=${course.id}`}>
                            Gradebook
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link href={`/learn/gradebook`}>My grades</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            {instructorHub ? 'More teaching tools' : 'Need to join or discover more?'}
          </h3>
          <Card className="brand-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                {instructorHub
                  ? 'Open the platform hub for course builder, drip scheduling, bundles, commerce, and analytics.'
                  : 'Use learning tools for assignments, gradebook, live classes, and bundles.'}
              </p>
              {instructorHub ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/instructor/platform">Platform hub</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/instructor/ai-studio">AI Studio</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/instructor/course-builder">Course Builder</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/learn">All learning tools</Link>
                  </Button>
                  <Link href="/courses">
                    <Button variant="outline">Open courses and catalog</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Shell>
  );
}
