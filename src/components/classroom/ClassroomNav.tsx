'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Megaphone, ClipboardList, Users, BarChart3, BookOpen } from 'lucide-react';

const tabs = [
  { href: 'stream', label: 'Stream', icon: Megaphone },
  { href: 'classwork', label: 'Classwork', icon: ClipboardList },
  { href: 'people', label: 'People', icon: Users },
  { href: 'grades', label: 'Grades', icon: BarChart3 },
  { href: 'lessons', label: 'Lessons', icon: BookOpen },
];

export function ClassroomNav({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const base = `/classroom/${courseId}`;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-px">
      {tabs.map(({ href, label, icon: Icon }) => {
        const full = `${base}/${href}`;
        const active = pathname === full || pathname.startsWith(`${full}/`);
        return (
          <Link
            key={href}
            href={full}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors',
              active
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
