import {
  LayoutDashboard,
  PenSquare,
  Sparkles,
  Home,
  GraduationCap,
  Workflow,
  Bot,
  School,
  ClipboardList,
  CalendarClock,
  BookOpenCheck,
  Video,
  Package,
  ShoppingBag,
  Table2,
  BarChart3,
  Award,
  GitBranch,
  Grid3X3,
  CreditCard,
} from 'lucide-react';
import type { NavSection } from '@/lib/nav-config';
import { learnerDashboardHref } from '@/lib/role-routes';

export const instructorNavSections: NavSection[] = [
  {
    label: 'Teaching',
    items: [
      { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/instructor/platform', label: 'All tools', icon: Grid3X3, exact: true },
      { href: '/classroom', label: 'Classroom Hub', icon: School, exact: true },
      { href: '/instructor/live-classes', label: 'Live Classes', icon: Video },
    ],
  },
  {
    label: 'Create',
    items: [
      { href: '/instructor/course-builder', label: 'Course Builder', icon: LayoutDashboard },
      { href: '/instructor/lessons', label: 'Lessons & Quizzes', icon: BookOpenCheck },
      { href: '/instructor/ai-studio', label: 'AI Studio', icon: Sparkles, badge: 'AI' },
      { href: '/instructor/content-drip', label: 'Content Drip', icon: CalendarClock },
      { href: '/instructor/certificates', label: 'Certificates', icon: Award },
      { href: '/instructor/teach', label: 'Teach Mode', icon: PenSquare },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/instructor/assignments', label: 'Assignments', icon: ClipboardList },
      { href: '/instructor/gradebook', label: 'Gradebook', icon: Table2 },
      { href: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/instructor/prerequisites', label: 'Prerequisites', icon: GitBranch },
      { href: '/instructor/bundles', label: 'Course Bundles', icon: Package },
      { href: '/instructor/commerce', label: 'eCommerce', icon: ShoppingBag },
      { href: '/instructor/subscriptions', label: 'Subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'Tools',
    items: [
      { action: 'chat', label: 'AI Assistant', icon: Bot, badge: 'Live' },
      { href: '/instructor/course-creator', label: 'AI Course Creator', icon: Sparkles },
      { href: '/instructor/bootcamp-studio', label: 'Bootcamp Studio', icon: Workflow },
    ],
  },
];

export const instructorFooterNav = [
  { href: learnerDashboardHref(true), label: 'Learner preview', icon: GraduationCap },
  { href: '/', label: 'Back to home', icon: Home },
];

export const instructorPageTitles: Record<string, string> = {
  '/instructor/dashboard': 'Instructor Dashboard',
  '/instructor/platform': 'Platform tools',
  '/classroom': 'Classroom Hub',
  '/instructor/teach': 'Teach Mode',
  '/instructor/course-builder': 'Course Builder',
  '/instructor/assignments': 'Assignments',
  '/instructor/content-drip': 'Content Drip',
  '/instructor/lessons': 'Lessons & Quizzes',
  '/instructor/live-classes': 'Live Classes',
  '/instructor/ai-studio': 'AI Studio',
  '/instructor/bundles': 'Course Bundles',
  '/instructor/commerce': 'eCommerce',
  '/instructor/gradebook': 'Gradebook',
  '/instructor/analytics': 'Analytics',
  '/instructor/certificates': 'Certificates',
  '/instructor/prerequisites': 'Prerequisites',
  '/instructor/subscriptions': 'Subscriptions',
  '/instructor/course-creator': 'AI Course Creator',
  '/instructor/bootcamp-studio': 'Bootcamp Studio',
};

export function getInstructorPageTitle(pathname: string): string {
  if (instructorPageTitles[pathname]) return instructorPageTitles[pathname];
  if (pathname.startsWith('/instructor/courses/')) return 'Course insights';
  if (pathname.startsWith('/classroom/')) return 'Classroom';
  return 'Instructor Portal';
}
