'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { getUpcomingAssignmentsForUser } from '@/lib/classroom-service';
import type { ClassroomAssignment } from '@/lib/classroom-types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function UpcomingAssignments({ userId }: { userId: string }) {
  const [items, setItems] = useState<(ClassroomAssignment & { courseTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingAssignmentsForUser(userId, 5)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No upcoming assignments. Join a classroom to see deadlines here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <Link
            href={`/classroom/${a.courseId}/assignments/${a.id}`}
            className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors"
          >
            <ClipboardList className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.courseTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Due {format(a.deadline, 'MMM d, yyyy')}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
