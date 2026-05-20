import {
  LayoutDashboard,
  Lightbulb,
  Presentation,
  CalendarClock,
  Sparkles,
  Home,
  GraduationCap,
} from 'lucide-react';
import type { NavSection } from '@/lib/nav-config';

export const startupNavSections: NavSection[] = [
  {
    label: 'Incubation',
    items: [
      { href: '/startup', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/startup/ideas', label: 'Ideas', icon: Lightbulb },
      { href: '/startup/pitch-deck', label: 'Pitch deck', icon: Presentation },
      { href: '/startup/mentorship', label: 'Mentorship', icon: CalendarClock },
    ],
  },
  {
    label: 'Founder tools',
    items: [{ href: '/startup/ai-tools', label: 'Founder AI', icon: Sparkles }],
  },
];

export const startupFooterNav = [
  { href: '/dashboard', label: 'Learner dashboard', icon: GraduationCap },
  { href: '/', label: 'Back to home', icon: Home },
];

export const startupPageTitles: Record<string, string> = {
  '/startup': 'Startup dashboard',
  '/startup/ideas': 'Ideas',
  '/startup/ideas/new': 'New idea',
  '/startup/pitch-deck': 'Pitch deck',
  '/startup/mentorship': 'Mentorship',
  '/startup/ai-tools': 'Founder AI',
};

export function getStartupPageTitle(pathname: string): string {
  if (startupPageTitles[pathname]) return startupPageTitles[pathname];
  if (pathname.startsWith('/startup/ideas/')) return 'Idea workspace';
  return 'Startup hub';
}
