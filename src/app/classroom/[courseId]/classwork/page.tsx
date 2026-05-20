'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import { getCourseAssignments, getClassroomCourse } from '@/lib/classroom-service';
import type { ClassroomAssignment, ClassroomCourse } from '@/lib/classroom-types';
import { useAuth } from '@/hooks/use-auth';
import { isOwnerOfClassroom } from '@/lib/instructor-course-access';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateAssignmentDialog } from '@/components/classroom/CreateAssignmentDialog';

export default function ClassworkPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { user, userProfile } = useAuth();
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [course, setCourse] = useState<ClassroomCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const canManage = isOwnerOfClassroom(course, user?.uid, user?.email);

  const load = () => {
    Promise.all([getCourseAssignments(courseId), getClassroomCourse(courseId)])
      .then(([list, c]) => {
        setAssignments(list);
        setCourse(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [courseId]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="font-heading text-xl font-semibold">Classwork</h2>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/instructor/courses/${courseId}`}>Students & submissions</Link>
            </Button>
            <CreateAssignmentDialog courseId={courseId} onCreated={load} />
          </div>
        ) : null}
      </div>
      {assignments.length === 0 ? (
        <Card className="brand-card p-8 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
          No assignments yet.
          {canManage ? (
            <p className="text-sm mt-2">Use Add assignment above to create the first one.</p>
          ) : null}
        </Card>
      ) : (
        assignments.map((a) => (
          <Card key={a.id} className="brand-card hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{a.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Due {format(a.deadline, 'MMM d, yyyy')} · {a.points} pts
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-2 mb-4">{a.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/classroom/${courseId}/assignments/${a.id}`}>
                    {canManage ? 'Review' : 'Open assignment'}
                  </Link>
                </Button>
                {canManage ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/instructor/gradebook?course=${courseId}`}>Gradebook</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
