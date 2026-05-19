'use client';

import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getClassroomCourse, getCourseEnrollmentsWithProgress } from '@/lib/classroom-service';
import { getUserProfile } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function GradesPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { user, userProfile } = useAuth();
  const [myProgress, setMyProgress] = useState(0);
  const [classProgress, setClassProgress] = useState<{ name: string; progress: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const course = await getClassroomCourse(courseId);
      const contentId = course?.contentCourseId || courseId;
      const progress = userProfile?.courseProgress?.[contentId] ?? 0;
      setMyProgress(progress);

      const enrollments = await getCourseEnrollmentsWithProgress(courseId);
      const rows: { name: string; progress: number }[] = [];
      for (const e of enrollments) {
        const p = await getUserProfile(e.studentId);
        rows.push({ name: p?.displayName || 'Student', progress: e.progress });
      }
      setClassProgress(rows);
      setLoading(false);
    }
    if (user) load();
  }, [courseId, user, userProfile]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      <Card className="brand-card">
        <CardHeader>
          <CardTitle>Your progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span>Course completion</span>
            <span className="font-semibold">{myProgress}%</span>
          </div>
          <Progress value={myProgress} className="h-3" />
        </CardContent>
      </Card>

      {classProgress.length > 0 && (
        <Card className="brand-card">
          <CardHeader>
            <CardTitle>Class overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classProgress.map((row) => (
              <div key={row.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{row.name}</span>
                  <span>{row.progress}%</span>
                </div>
                <Progress value={row.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
