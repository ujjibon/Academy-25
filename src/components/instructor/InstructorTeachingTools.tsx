'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstructorManualCourseStudio } from '@/components/instructor/InstructorManualCourseStudio';
import { TeachModeContent } from '@/components/teach/TeachModeContent';
import { CourseCreatorContent } from '@/components/instructor/CourseCreatorContent';
import { BootcampStudioContent } from '@/components/instructor/BootcampStudioContent';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { PenSquare, Pencil, Sparkles, Workflow } from 'lucide-react';

interface InstructorTeachingToolsProps {
  courses: ClassroomCourse[];
  onCoursesChange?: () => void;
  initialEditCourseId?: string | null;
}

export function InstructorTeachingTools({
  courses,
  onCoursesChange,
  initialEditCourseId,
}: InstructorTeachingToolsProps) {
  return (
    <section className="dashboard-panel p-6 space-y-6">
      <header>
        <span className="dashboard-kicker">Create & generate</span>
        <h2 className="font-heading text-xl font-semibold tracking-tight mt-3">
          Teaching & course generation
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Manually create and edit full courses, generate with AI, or launch bootcamps — all from
          your dashboard.
        </p>
      </header>

      <Tabs defaultValue={initialEditCourseId ? 'manual' : 'manual'} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-background">
            <Pencil className="h-4 w-4" />
            Manual create & edit
          </TabsTrigger>
          <TabsTrigger value="teach" className="gap-2 data-[state=active]:bg-background">
            <PenSquare className="h-4 w-4" />
            Teach mode
          </TabsTrigger>
          <TabsTrigger value="creator" className="gap-2 data-[state=active]:bg-background">
            <Sparkles className="h-4 w-4" />
            AI lesson creator
          </TabsTrigger>
          <TabsTrigger value="bootcamp" className="gap-2 data-[state=active]:bg-background">
            <Workflow className="h-4 w-4" />
            Bootcamp studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <InstructorManualCourseStudio
            courses={courses}
            onCoursesChange={onCoursesChange}
            initialEditCourseId={initialEditCourseId}
          />
        </TabsContent>

        <TabsContent value="teach" className="mt-6">
          <Card className="brand-card border-dashed">
            <CardHeader className="pb-2">
              <CardDescription>
                AI generates a full course from a topic. Use Manual create & edit to customize
                lessons afterward.
              </CardDescription>
            </CardHeader>
          </Card>
          <TeachModeContent embedded onCoursePublished={onCoursesChange} />
        </TabsContent>

        <TabsContent value="creator" className="mt-6">
          <CourseCreatorContent showHeader={false} />
        </TabsContent>

        <TabsContent value="bootcamp" className="mt-6">
          <BootcampStudioContent showHeader={false} onPublished={onCoursesChange} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
