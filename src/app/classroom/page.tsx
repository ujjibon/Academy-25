'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { getUserEnrolledCourses } from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, GraduationCap, Library, Megaphone } from 'lucide-react';

export default function ClassroomHubPage() {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEnrolled = useCallback(async () => {
    if (!user) return;
    const list = await getUserEnrolledCourses(user.uid);
    setEnrolled(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadEnrolled();
  }, [loadEnrolled]);

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl">
        <section className="dashboard-hero p-6 md:p-8">
          <span className="dashboard-kicker">Classroom</span>
          <h2 className="font-dashboard-title mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Classroom Hub
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Access your classes in one place. Open stream announcements, classwork, and submissions quickly,
            similar to a classroom-first workflow.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/courses" className="brand-button text-sm inline-flex items-center px-4 py-2">
              Browse courses
            </Link>
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
          ) : enrolled.length === 0 ? (
            <Card className="brand-card">
              <CardHeader>
                <CardTitle>No classrooms yet</CardTitle>
                <CardDescription>
                  Join a course to start seeing stream updates, classwork, and submissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/courses">
                  <Button>Go to courses</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrolled.map((course) => (
                <Card key={course.id} className="brand-card">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-base">{course.title}</CardTitle>
                    <CardDescription>Code: {course.classCode}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            Need to join or discover more?
          </h3>
          <Card className="brand-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Use the Courses page to join with class code, create a class (instructor), and explore catalog
                content.
              </p>
              <Link href="/courses">
                <Button variant="outline">Open courses and catalog</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
