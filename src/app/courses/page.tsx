import AppLayout from '@/components/layout/AppLayout';
import { CourseCard } from '@/components/courses/CourseCard';
import { courses } from '@/lib/courses';

export default function CoursesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Browse our catalog and start a new learning adventure.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
