'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreateCourseDialog } from '@/components/classroom/CreateCourseDialog';
import { getInstructorCourses } from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, ClipboardList, Sparkles } from 'lucide-react';

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const list = await getInstructorCourses(user.uid);
    setCourses(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const totalStudents = courses.reduce(
    (sum, c) => sum + c.enrolledStudentIds.filter((id) => id !== c.instructorId).length,
    0
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <section className="dashboard-hero p-6 md:p-8">
        <span className="dashboard-kicker">Instructor</span>
        <h1 className="font-dashboard-title mt-3 text-2xl font-bold sm:text-3xl">
          Teaching dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage classrooms, assignments, and AI-generated course content.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <CreateCourseDialog onCreated={load} />
          <Button variant="outline" asChild className="brand-button-ghost">
            <Link href="/admin-portal/course-creator">
              <Sparkles className="mr-2 h-4 w-4" />
              AI course creator
            </Link>
          </Button>
        </div>
      </section>

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
                  <Button size="sm" asChild>
                    <Link href={`/classroom/${course.id}/stream`}>Open classroom</Link>
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
