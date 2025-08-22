'use client';
import { useEffect } from 'react';
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
  params: { courseId: string; lessonId: string };
}) {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const course = getCourse(params.courseId);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === params.lessonId);
  if (lessonIndex === -1) notFound();

  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  // Calculate progress percentage
  const currentProgress = userProfile?.courseProgress[params.courseId] || 0;
  const lessonProgress = ((lessonIndex + 1) / course.lessons.length) * 100;
  const isLessonCompleted = currentProgress >= lessonProgress;

  // Mark lesson as completed and update progress
  const markLessonCompleted = async () => {
    if (!user || !userProfile) return;

    try {
      const newProgress = Math.max(currentProgress, lessonProgress);
      await updateCourseProgress(user.uid, params.courseId, newProgress);
      
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
  }, [user, userProfile, params.courseId, params.lessonId]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          href={`/courses/${course.id}`}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {course.title}
        </Link>
        
        {/* Course Progress */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(currentProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Lesson {lessonIndex + 1} of {course.lessons.length}</span>
            {isLessonCompleted && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {lesson.title}
          </h1>
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
              className="bg-green-600 hover:bg-green-700"
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
