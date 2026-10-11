import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { CourseDetailHero } from '@/components/courses/CourseDetailHero';
import { LearningAdventure } from '@/components/learning/LearningAdventure';
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

  return (
    <AppLayout>
      <div className="page-stack mx-auto w-full max-w-5xl">
        <CourseDetailHero
          course={course}
          details={details}
          firstLessonId={firstLessonId}
        />

        <LearningAdventure fixedCourse={course} />
      </div>
    </AppLayout>
  );
}
