import AppLayout from '@/components/layout/AppLayout';
import { CourseCard } from '@/components/courses/CourseCard';
import { courses } from '@/lib/courses';
import Link from 'next/link';

export default function CoursesPage() {
  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl">
        <section className="dashboard-hero p-6 md:p-8">
          <span className="dashboard-kicker">Catalog</span>
          <h2 className="font-dashboard-title mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Explore courses
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Browse structured paths with AI-guided lessons, projects, and progress tracking.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard" className="brand-button-ghost text-sm">
              Back to dashboard
            </Link>
            <Link href="/teach" className="brand-button text-sm">
              Open teach mode
            </Link>
          </div>
        </section>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
