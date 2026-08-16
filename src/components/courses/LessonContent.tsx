'use client';

import type { Lesson, Course } from '@/lib/data-provider';
import { GuidedLessonFlow } from '@/components/courses/GuidedLessonFlow';
import { AILearningClassroom } from './AILearningClassroom';
import {
  LessonPanel,
  LessonPanelContent,
  LessonPanelDescription,
  LessonPanelHeader,
  LessonPanelTitle,
} from '@/components/courses/LessonPanel';

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
      <GuidedLessonFlow
        course={course}
        lesson={lesson}
        autoStartAi={autoStartAi}
        onLessonComplete={onLessonComplete}
      />

      <LessonPanel>
        <LessonPanelHeader className="space-y-1 p-4 sm:p-6">
          <LessonPanelTitle className="text-lg sm:text-xl">AI Classroom</LessonPanelTitle>
          <LessonPanelDescription className="text-sm">
            Optional slide-style classroom if you want another way to review this lesson.
          </LessonPanelDescription>
        </LessonPanelHeader>
        <LessonPanelContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <AILearningClassroom course={course} lesson={lesson} />
        </LessonPanelContent>
      </LessonPanel>
    </div>
  );
}
