'use client';
import { useEffect, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { getCourse } from '@/lib/data-provider';
import { notFound } from 'next/navigation';
import { LessonContent } from '@/components/courses/LessonContent';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateCourseProgress, addXP } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  // Unwrap the params Promise
  const { courseId, lessonId } = use(params);
  
  const course = getCourse(courseId);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) notFound();

  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  // Calculate progress percentage
  const currentProgress = userProfile?.courseProgress[courseId] || 0;
  const lessonProgress = ((lessonIndex + 1) / course.lessons.length) * 100;
  const isLessonCompleted = currentProgress >= lessonProgress;

  // Mark lesson as completed and update progress
  const markLessonCompleted = async () => {
    if (!user || !userProfile) return;

    try {
      const newProgress = Math.max(currentProgress, lessonProgress);
      await updateCourseProgress(user.uid, courseId, newProgress);
      
      // Add XP for completing lesson
      const xpEarned = 25; // Base XP per lesson
      await addXP(user.uid, xpEarned);
      
      // Refresh user profile to show updated data
      await refreshProfile();
      
      toast({
        title: 'Lesson Completed!',
        description: `You earned ${xpEarned} XP!`,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Auto-mark lesson as completed when user reaches it
  useEffect(() => {
    if (user && userProfile && !isLessonCompleted) {
      markLessonCompleted();
    }
  }, [user, userProfile, courseId, lessonId]);

  return (
    <AppLayout>
      <div className="lesson-page space-y-6">
        <Link
          href={`/courses/${course.id}`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {course.title}
        </Link>

        <div className="stat-card stat-card-muted !min-h-0">
          <span className="stat-card-label">Course progress</span>
          <p className="stat-card-value">{Math.round(currentProgress)}%</p>
          <div className="lesson-progress-track my-3 w-full">
            <div
              className="lesson-progress-fill"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="stat-card-sub">
              Lesson {lessonIndex + 1} of {course.lessons.length}
            </p>
            {isLessonCompleted && (
              <span className="text-flare flex items-center gap-1 text-sm font-medium">
                <CheckCircle className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
        </div>

        <div>
          <h1 className="lesson-page-title">{lesson.title}</h1>
        </div>
        
        <LessonContent course={course} lesson={lesson} />

        <div className="flex justify-between mt-8">
          {prevLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Link>
            </Button>
          ) : <div />}
          
          {nextLesson ? (
            <Button asChild>
              <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button
              onClick={markLessonCompleted}
              className="brand-button-flare"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Course
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
