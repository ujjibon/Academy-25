'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, Gamepad2, Layers3, NotebookPen, Route, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/learn/adventure', label: 'Watch & play', icon: Clapperboard },
  { href: '/learn/path', label: 'Your path', icon: Route },
  { href: '/learn/study', label: 'Recall lab', icon: Layers3 },
  { href: '/training', label: 'Skill missions', icon: Gamepad2 },
  { href: '/learn/notes', label: 'Field notes', icon: NotebookPen },
];

export function LearningJourneyNav() {
  const pathname = usePathname();
  if (!pathname || !/^\/(learn|courses|training)(\/|$)/.test(pathname)) return null;
  return (
    <nav aria-label="Learning journey" className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[#dedbd2] bg-[#fffaf2] p-3 text-slate-800">
      <span className="mr-auto flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.14em]"><Sparkles className="h-4 w-4 text-[#b54730]" /> Learning studio</span>
      <div className="flex max-w-full gap-1 overflow-x-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors', pathname === href ? 'bg-slate-900 text-white' : 'hover:bg-white hover:shadow-sm')}>
            <Icon className="h-3.5 w-3.5" />{label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
