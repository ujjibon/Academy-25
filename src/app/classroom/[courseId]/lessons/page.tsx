'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Clock, PlayCircle } from 'lucide-react';
import { getClassroomCourse, getCourseContent, isModuleReleased } from '@/lib/classroom-service';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { groupLessonsIntoModules } from '@/lib/classroom-types';
import type { Course } from '@/lib/data-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function LessonsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [content, setContent] = useState<Course | null>(null);
  const [classroom, setClassroom] = useState<ClassroomCourse | null>(null);
  const [contentId, setContentId] = useState(courseId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const classroomCourse = await getClassroomCourse(courseId);
      setClassroom(classroomCourse);
      const id = classroomCourse?.contentCourseId || courseId;
      setContentId(id);
      const c = await getCourseContent(id);
      setContent(c);
      setLoading(false);
    }
    load();
  }, [courseId]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!content) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Lesson content is not available for this course yet.
      </p>
    );
  }

  const modules =
    classroom?.modules?.length
      ? classroom.modules
      : groupLessonsIntoModules(content.lessons);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Course curriculum</h2>
      <Accordion type="single" collapsible className="w-full">
        {modules.map((mod) => {
          const released = classroom ? isModuleReleased(classroom, mod.id) : true;
          const releaseEntry = classroom?.dripSchedule?.find((s) => s.moduleId === mod.id);
          return (
          <AccordionItem key={mod.id} value={mod.id} disabled={!released}>
            <AccordionTrigger>
              <span className="font-medium">
                {mod.title}: {mod.lessonIds.length} lessons
                {!released && releaseEntry ? (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    Unlocks {new Date(releaseEntry.releaseAt).toLocaleDateString()}
                  </span>
                ) : null}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {!released ? (
                <p className="text-sm text-muted-foreground py-2">
                  This module is scheduled for a later release.
                </p>
              ) : (
              <ul className="space-y-2 pl-2">
                {mod.lessonIds.map((lessonId) => {
                  const lesson = content.lessons.find((l) => l.id === lessonId);
                  if (!lesson) return null;
                  const lessonIndex = content.lessons.findIndex((l) => l.id === lessonId);
                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0"
                    >
                      <LessonRow lesson={lesson} index={lessonIndex} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/courses/${contentId}/${lesson.id}`}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Start
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
              )}
            </AccordionContent>
          </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function LessonRow({
  lesson,
  index,
}: {
  lesson: { id: string; title: string; duration: number };
  index: number;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-primary font-bold text-sm w-6">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <p className="font-medium truncate">{lesson.title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {lesson.duration} min
        </p>
      </div>
    </div>
  );
}
