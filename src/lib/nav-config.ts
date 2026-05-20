import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  PenSquare,
  Bot,
  User,
  Shield,
  FileEdit,
  Users,
  Home,
  Sparkles,
  GraduationCap,
  School,
  Rocket,
} from 'lucide-react';

export type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  action?: 'chat';
  exact?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const mainNavSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'Classroom',
    items: [
      { href: '/classroom', label: 'Classroom Hub', icon: School, exact: true },
      { href: '/courses', label: 'Courses & Catalog', icon: BookOpen },
    ],
  },
  {
    label: 'Startup',
    items: [{ href: '/startup', label: 'Startup hub', icon: Rocket, exact: true }],
  },
  {
    label: 'Learning',
    items: [
      { href: '/teach', label: 'Teach Mode', icon: PenSquare },
      { action: 'chat', label: 'AI Assistant', icon: Bot, badge: 'Live' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: User },
    ],
  },
];

export const adminNavSection: NavSection = {
  label: 'Admin',
  items: [
    { href: '/admin-portal', label: 'Admin Portal', icon: Shield, exact: true },
    { href: '/admin-portal/courses', label: 'Manage Courses', icon: BookOpen },
    { href: '/admin-portal/course-creator', label: 'AI Course Creator', icon: Sparkles },
    { href: '/admin-portal/bootcamp-studio', label: 'Bootcamp Studio', icon: GraduationCap },
    { href: '/admin-portal/manual-editor', label: 'Manual Editor', icon: FileEdit },
    { href: '/admin-portal/users', label: 'Users', icon: Users },
    { href: '/admin-portal/startup', label: 'Startup program', icon: Rocket },
  ],
};

export const footerNavItems: NavItem[] = [
  { href: '/', label: 'Back to home', icon: Home },
];

export const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/classroom': 'Classroom Hub',
  '/courses': 'Courses',
  '/profile': 'Profile',
  '/leaderboard': 'Leaderboard',
  '/teach': 'Teach Mode',
  '/startup': 'Startup hub',
  '/admin-portal': 'Admin Portal',
  '/admin-portal/courses': 'Manage Courses',
  '/admin-portal/course-creator': 'AI Course Creator',
  '/admin-portal/bootcamp-studio': 'Bootcamp Studio',
  '/admin-portal/manual-editor': 'Manual Editor',
  '/admin-portal/users': 'Users',
  '/admin-portal/startup': 'Startup program',
  '/admin-portal/unauthorized': 'Access restricted',
};

export function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/courses/') && pathname.includes('/')) {
    return 'Lesson';
  }
  if (pathname.startsWith('/courses/')) return 'Course';
  return 'Peer Academy';
}
