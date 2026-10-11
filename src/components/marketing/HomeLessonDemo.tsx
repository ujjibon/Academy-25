'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { Course, Lesson } from '@/lib/data-provider';
import { Skeleton } from '@/components/ui/skeleton';

const LessonContent = dynamic(
  () =>
    import('@/components/courses/LessonContent').then((m) => ({
      default: m.LessonContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    ),
  }
);

type HomeLessonDemoProps = {
  course: Course;
  lesson: Lesson;
};

export function HomeLessonDemo({ course, lesson }: HomeLessonDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="lesson-page home-lesson-demo min-h-[320px]">
      {!shouldLoad ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-royal/70" />
          <p className="text-sm">Scroll to load the interactive demo…</p>
        </div>
      ) : (
        <LessonContent course={course} lesson={lesson} autoStartAi={false} />
      )}
    </div>
  );
}
