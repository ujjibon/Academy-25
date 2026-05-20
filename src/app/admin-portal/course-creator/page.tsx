'use client';

import { CourseCreatorContent } from '@/components/instructor/CourseCreatorContent';

export default function AdminCourseCreatorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Course Creator</h1>
        <p className="text-muted-foreground mt-1">
          Agentic architect plans and builds full courses; lesson chat refines one lesson at a time.
        </p>
      </div>
      <CourseCreatorContent showHeader={false} />
    </div>
  );
}
