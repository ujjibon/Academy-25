import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { CourseDetailHero } from '@/components/courses/CourseDetailHero';
import { CourseGamifyPanel } from '@/components/courses/CourseGamifyPanel';
import { getCourseDetails } from '@/lib/course-details';
import { getCourse } from '@/lib/data-provider';

export default async function CourseGamifyPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  const details = getCourseDetails(courseId);

  if (!course || !details) {
    notFound();
  }

  const firstLessonId = course.lessons[0]?.id;
  const lessonTitles = course.lessons.map((lesson) => lesson.title);

  return (
    <AppLayout>
      <div className="page-stack mx-auto w-full max-w-5xl">
        <CourseDetailHero
          course={course}
          details={details}
          firstLessonId={firstLessonId}
        />

        <section className="dashboard-panel panel-padding">
          <CourseGamifyPanel
            courseId={course.id}
            courseTitle={course.title}
            courseDescription={course.description}
            lessonTitles={lessonTitles}
          />
        </section>
      </div>
    </AppLayout>
  );
}
