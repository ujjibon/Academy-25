'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { courses } from '@/lib/courses';
import { getCourse } from '@/lib/data-provider';
import { AdminLiveCoursesManagement } from '@/components/admin/AdminLiveCoursesManagement';
import { FilePlus2, Pencil, ExternalLink, Store, BookOpen } from 'lucide-react';

export default function AdminCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Publish and manage live classroom courses, or edit the static catalog.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketplace" target="_blank">
              <Store className="mr-2 h-4 w-4" />
              Marketplace
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin-portal/manual-editor">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Create course
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="live" className="gap-2">
            <Store className="h-4 w-4" />
            Live courses
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Static catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <AdminLiveCoursesManagement />
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Built-in JSON courses used by the learn catalog. Edit content here, then use{' '}
            <span className="font-medium text-foreground">Seed catalog live</span> on the Live
            courses tab to sync them into Firestore classrooms.
          </p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
