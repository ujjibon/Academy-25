'use client';

import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getClassroomCourse } from '@/lib/classroom-service';
import { getUserProfile } from '@/lib/firebase';
import type { ClassroomCourse } from '@/lib/classroom-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

type Member = { id: string; name: string; photo?: string; role: string };

export default function PeoplePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<ClassroomCourse | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = await getClassroomCourse(courseId);
      setCourse(c);
      if (!c) {
        setLoading(false);
        return;
      }
      const list: Member[] = [];
      for (const id of c.enrolledStudentIds) {
        const profile = await getUserProfile(id);
        list.push({
          id,
          name: profile?.displayName || 'Student',
          photo: profile?.photoURL,
          role: id === c.instructorId ? 'Instructor' : 'Student',
        });
      }
      setMembers(list);
      setLoading(false);
    }
    load();
  }, [courseId]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!course) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" />
        People ({members.length})
      </h2>
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="text-base">Teachers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members
            .filter((m) => m.role === 'Instructor')
            .map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
        </CardContent>
      </Card>
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="text-base">Students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.filter((m) => m.role === 'Student').length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
          ) : (
            members
              .filter((m) => m.role === 'Student')
              .map((m) => <MemberRow key={m.id} member={m} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={member.photo} />
        <AvatarFallback>{member.name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{member.name}</p>
        <p className="text-xs text-muted-foreground">{member.role}</p>
      </div>
    </div>
  );
}
