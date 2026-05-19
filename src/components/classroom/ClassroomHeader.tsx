'use client';

import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ClassroomCourse } from '@/lib/classroom-types';

export function ClassroomHeader({ course }: { course: ClassroomCourse }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyCode = async () => {
    await navigator.clipboard.writeText(course.classCode);
    setCopied(true);
    toast({ title: 'Class code copied', description: course.classCode });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard-hero overflow-hidden p-0">
      <Image
        src={course.coverImage}
        alt={course.title}
        width={1200}
        height={280}
        className="h-36 w-full object-cover md:h-44"
      />
      <div className="p-6">
        <ClassroomHeaderBody course={course} copied={copied} onCopy={copyCode} />
      </div>
    </div>
  );
}

function ClassroomHeaderBody({
  course,
  copied,
  onCopy,
}: {
  course: ClassroomCourse;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="dashboard-kicker">Classroom</span>
        <h1 className="font-dashboard-title mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          {course.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Instructor: <span className="font-medium text-foreground">{course.instructorName}</span>
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onCopy} className="shrink-0">
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
        Code: {course.classCode}
      </Button>
    </div>
  );
}
