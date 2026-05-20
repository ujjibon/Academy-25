import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  PenSquare,
  Sparkles,
  Home,
  GraduationCap,
  Workflow,
} from 'lucide-react';
import type { NavSection } from '@/lib/nav-config';

export const instructorNavSections: NavSection[] = [
  {
    label: 'Teaching',
    items: [
      { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/courses', label: 'Course catalog', icon: BookOpen },
      { href: '/instructor/teach', label: 'Teach Mode', icon: PenSquare },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/instructor/course-creator', label: 'AI Course Creator', icon: Sparkles },
      { href: '/instructor/bootcamp-studio', label: 'Bootcamp Studio', icon: Workflow },
    ],
  },
];

export const instructorFooterNav = [
  { href: '/dashboard', label: 'Learner view', icon: GraduationCap },
  { href: '/', label: 'Back to home', icon: Home },
];

export const instructorPageTitles: Record<string, string> = {
  '/instructor/dashboard': 'Instructor Dashboard',
  '/instructor/teach': 'Teach Mode',
  '/courses': 'Courses',
  '/instructor/course-creator': 'AI Course Creator',
  '/instructor/bootcamp-studio': 'Bootcamp Studio',
};

export function getInstructorPageTitle(pathname: string): string {
  if (instructorPageTitles[pathname]) return instructorPageTitles[pathname];
  if (pathname.startsWith('/classroom/')) return 'Classroom';
  return 'Instructor Portal';
}
