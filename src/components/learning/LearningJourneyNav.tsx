'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Layers3, NotebookPen, Route } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/learn/adventure', label: 'Play & learn', icon: Gamepad2 },
  { href: '/learn/path', label: 'Your path', icon: Route },
  { href: '/learn/study', label: 'Recall lab', icon: Layers3 },
  { href: '/training', label: 'Practice', icon: Gamepad2 },
  { href: '/learn/notes', label: 'Notes', icon: NotebookPen },
];

export function LearningJourneyNav() {
  const pathname = usePathname();
  if (!pathname || !/^\/(learn|courses|training)(\/|$)/.test(pathname)) return null;
  return (
    <nav aria-label="Learning navigation" className="mb-5 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-[#20242b]">
      <span className="mr-auto px-1 text-sm font-semibold">Learn</span>
      <div className="flex max-w-full gap-1 overflow-x-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors', pathname === href ? 'bg-[#335cff]/10 text-[#335cff]' : 'text-slate-500 hover:bg-white hover:text-slate-900')}>
            <Icon className="h-3.5 w-3.5" />{label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
