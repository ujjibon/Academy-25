'use client';

import type { Lesson, Course } from '@/lib/data-provider';
import { LessonExpedition } from '@/components/learning/LessonExpedition';

export function LessonContent({
  course,
  lesson,
  autoStartAi = true,
  onLessonComplete,
}: {
  course: Course;
  lesson: Lesson;
  /** When false, skips automatic AI guide + tutor calls on mount (e.g. homepage demo). */
  autoStartAi?: boolean;
  onLessonComplete?: (payload: { assessmentScore: number }) => void;
}) {
  return (
    <div className="space-y-8">
      <LessonExpedition
        key={`${course.id}:${lesson.id}`}
        course={course}
        lesson={lesson}
        autoStartAi={autoStartAi}
        onLessonComplete={onLessonComplete}
      />

    </div>
  );
}
