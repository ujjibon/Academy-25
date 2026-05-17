'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { courses } from '@/lib/courses';
import { getCourse } from '@/lib/data-provider';
import { FilePlus2, Pencil, ExternalLink } from 'lucide-react';

export default function AdminCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage the course catalog and lesson content.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin-portal/manual-editor">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create course
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => {
          const fullCourse = getCourse(course.id);
          const lessonCount = fullCourse?.lessons.length ?? 0;

          return (
            <Card key={course.id}>
              <CardHeader className="flex flex-row gap-4 space-y-0">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{lessonCount} lessons</Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {course.id}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="default">
                  <Link
                    href={`/admin-portal/manual-editor?course=${encodeURIComponent(course.id)}`}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/courses/${course.id}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
