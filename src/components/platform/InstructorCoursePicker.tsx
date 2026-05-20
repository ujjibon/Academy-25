'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClassroomCourse } from '@/lib/classroom-types';

type Props = {
  courses: ClassroomCourse[];
  value: string;
  onChange: (courseId: string) => void;
  placeholder?: string;
};

export function InstructorCoursePicker({
  courses,
  value,
  onChange,
  placeholder = 'Select a course',
}: Props) {
  if (courses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No courses yet. Create one in Course Builder first.
      </p>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="max-w-md">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {courses.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.title} ({c.classCode})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
