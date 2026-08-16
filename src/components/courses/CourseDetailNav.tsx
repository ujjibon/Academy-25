'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardList, Layers, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { suffix: '', label: 'Overview', icon: BookOpen },
  { suffix: '/curriculum', label: 'Curriculum', icon: Layers },
  { suffix: '/materials', label: 'Materials', icon: ClipboardList },
  { suffix: '/resources', label: 'Resources', icon: BookMarked },
] as const;

export function CourseDetailNav({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const base = `/courses/${courseId}`;

  return (
    <nav
      aria-label="Course sections"
      className="flex gap-1 overflow-x-auto rounded-full border border-royal/20 bg-royal/10 p-1.5"
    >
      {TABS.map(({ suffix, label, icon: Icon }) => {
        const href = `${base}${suffix}`;
        const active =
          suffix === ''
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-royal text-white shadow-[0_2px_8px_rgb(0_19_158/0.25)]'
                : 'text-midnight/70 hover:bg-royal/15 hover:text-royal'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
