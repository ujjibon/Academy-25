'use client';

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { CourseCard } from '@/components/courses/CourseCard';
import { JoinCourseDialog } from '@/components/classroom/JoinCourseDialog';
import { CreateCourseDialog } from '@/components/classroom/CreateCourseDialog';
import { courses as catalog } from '@/lib/courses';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';
import {
  getUserEnrolledCourses,
  seedBuiltInClassroomCourses,
} from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function CoursesPage() {
  const { user, userProfile } = useAuth();
  const [enrolled, setEnrolled] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const canInstruct = isInstructorOrAdmin(userProfile, user?.email);

  const loadEnrolled = useCallback(async () => {
    if (!user) return;
    const list = await getUserEnrolledCourses(user.uid);
    setEnrolled(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadEnrolled();
  }, [loadEnrolled]);

  const handleSeed = async () => {
    if (!user || !userProfile) return;
    setSeeding(true);
    try {
      await seedBuiltInClassroomCourses(user.uid, userProfile.displayName);
      await loadEnrolled();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl">
        <section className="dashboard-hero p-6 md:p-8">
          <span className="dashboard-kicker">Catalog</span>
          <h2 className="font-dashboard-title mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            My courses
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Join classrooms with a code, explore built-in paths, or create your own as an instructor.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <JoinCourseDialog onJoined={loadEnrolled} />
            {canInstruct && <CreateCourseDialog onCreated={loadEnrolled} />}
            <Link href="/dashboard" className="brand-button-ghost text-sm inline-flex items-center px-4 py-2">
              Dashboard
            </Link>
            <Link href="/teach" className="brand-button text-sm inline-flex items-center px-4 py-2">
              Teach Mode
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Enrolled classrooms
          </h3>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 rounded-[var(--radius)]" />
              ))}
            </div>
          ) : enrolled.length === 0 ? (
            <Card className="brand-card p-6 text-center">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t joined any classrooms yet. Use a class code or browse the catalog below.
              </p>
              {canInstruct && (
                <Button variant="outline" onClick={handleSeed} disabled={seeding}>
                  {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Initialize built-in courses
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrolled.map((course) => (
                <EnrolledCourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Course catalog
          </h3>
          <p className="text-sm text-muted-foreground">
            Open a course to preview content, or join its classroom from your instructor&apos;s class code.
          </p>
          <CourseCatalog />
        </section>
      </div>
    </AppLayout>
  );
}

function EnrolledCourseCard({ course }: { course: ClassroomCourse }) {
  return (
    <Link href={`/classroom/${course.id}/stream`} className="brand-card hover-lift block overflow-hidden p-0">
      <div className="aspect-video relative overflow-hidden">
        <Image src={course.coverImage} alt={course.title} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold">{course.title}</h4>
        <p className="text-xs text-muted-foreground mt-1">Code: {course.classCode}</p>
      </CardContent>
    </Link>
  );
}

function CourseCatalog() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {catalog.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
