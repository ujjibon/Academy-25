'use client';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { getCourse } from '@/lib/data-provider';
import { notFound } from 'next/navigation';
import { LessonContent } from '@/components/courses/LessonContent';
import { LessonNotesPanel } from '@/components/learn/LessonNotesPanel';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateCourseProgress, addXP, setActiveLesson } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [justCompleted, setJustCompleted] = useState(false);
  const completingLesson = useRef(false);
  const { courseId, lessonId } = use(params);
  useEffect(() => {
    setJustCompleted(false);
    completingLesson.current = false;
  }, [courseId, lessonId]);

  const course = useMemo(() => getCourse(courseId), [courseId]);
  const lessonIndex = useMemo(
    () => course?.lessons.findIndex((l) => l.id === lessonId) ?? -1,
    [course, lessonId]
  );
  const lesson = course && lessonIndex >= 0 ? course.lessons[lessonIndex] : null;
  const prevLesson =
    course && lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    course && lessonIndex >= 0 && lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  const currentProgress = userProfile?.courseProgress?.[courseId] || 0;
  const lessonProgress =
    course && lessonIndex >= 0
      ? ((lessonIndex + 1) / course.lessons.length) * 100
      : 0;
  const isLessonCompleted = justCompleted || currentProgress >= lessonProgress;

  useEffect(() => {
    if (!user || !course || !lesson) return;
    void setActiveLesson(user.uid, courseId, lessonId);
  }, [user, course, lesson, courseId, lessonId]);

  const markLessonCompleted = useCallback(
    async (assessmentScore?: number) => {
      if (completingLesson.current || justCompleted || currentProgress >= lessonProgress) return;
      completingLesson.current = true;
      if (!user || !userProfile) {
        setJustCompleted(true);
        toast({
          title: 'Lesson mastered!',
          description:
            assessmentScore != null
              ? `Assessment score: ${assessmentScore}%. Sign in to save progress.`
              : 'Sign in to save progress across devices.',
        });
        return;
      }

      try {
        const newProgress = Math.max(currentProgress, lessonProgress);
        await updateCourseProgress(user.uid, courseId, newProgress, lessonId);

        const xpEarned = assessmentScore != null && assessmentScore >= 80 ? 40 : 25;
        await addXP(user.uid, xpEarned);
        await refreshProfile();
        setJustCompleted(true);

        toast({
          title: 'Lesson completed!',
          description:
            assessmentScore != null
              ? `You scored ${assessmentScore}% and earned ${xpEarned} XP.`
              : `You earned ${xpEarned} XP!`,
        });
      } catch (error) {
        console.error('Error updating progress:', error);
        setJustCompleted(true);
        toast({
          title: 'Progress sync issue',
          description: 'Lesson marked complete here, but cloud save failed. Try again later.',
          variant: 'destructive',
        });
      }
    },
    [user, userProfile, justCompleted, currentProgress, lessonProgress, courseId, lessonId, refreshProfile, toast]
  );

  if (!course || !lesson) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="lesson-page space-y-5">
        <Link
          href={`/courses/${course.id}`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {course.title}
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>Lesson {lessonIndex + 1} of {course.lessons.length}</span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Course progress" aria-valuenow={Math.round(currentProgress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[#335cff]" style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }} />
          </div>
          <span>{Math.round(currentProgress)}% complete</span>
          {isLessonCompleted && <span className="flex items-center gap-1 text-[#335cff]"><CheckCircle className="h-3 w-3" />Completed</span>}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#20242b] sm:text-3xl">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ~{lesson.duration} min · Play, watch, and try it yourself
            </p>
          </div>
          <LessonNotesPanel
            courseId={course.id}
            lessonId={lesson.id}
            courseTitle={course.title}
            lessonTitle={lesson.title}
          />
        </div>

        <LessonContent
          course={course}
          lesson={lesson}
          onLessonComplete={({ assessmentScore }) => {
            void markLessonCompleted(assessmentScore);
          }}
        />

        <div className="flex justify-between mt-8">
          {prevLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            isLessonCompleted ? (
              <Button asChild>
                <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                  Next lesson
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled title="Complete the assessment first">
                <Lock className="h-4 w-4 mr-2" />
                Next lesson locked
              </Button>
            )
          ) : (
            <Button
              onClick={() => markLessonCompleted()}
              className="brand-button-flare"
              disabled={!isLessonCompleted}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLessonCompleted ? 'Course complete' : 'Finish assessment first'}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
