import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Bot,
  User,
  Settings,
  Shield,
  FileEdit,
  Users,
  Home,
  Sparkles,
  GraduationCap,
  School,
  Rocket,
  Dumbbell,
  Award,
  ClipboardList,
  Table2,
  Video,
  Package,
  GitBranch,
  CalendarClock,
  BookOpenCheck,
  ShoppingBag,
  BarChart3,
  CreditCard,
  Search,
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
    label: 'Learn',
    items: [
      { href: '/learn', label: 'My Learning', icon: BookOpenCheck, exact: true },
      { href: '/learn/path', label: 'Adaptive Path', icon: GitBranch },
      { href: '/learn/study', label: 'Study Lab', icon: Dumbbell },
      { href: '/learn/notes', label: 'Notes', icon: FileEdit },
      { href: '/learn/search', label: 'Search', icon: Search },
      { href: '/courses', label: 'Explore', icon: BookOpen },
      { href: '/learn/assignments', label: 'Assignments', icon: ClipboardList },
      { href: '/learn/gradebook', label: 'Gradebook', icon: Table2 },
      { href: '/learn/live-classes', label: 'Live Classes', icon: Video },
      { href: '/learn/lessons', label: 'Lessons & Quizzes', icon: BookOpenCheck },
      { href: '/learn/content-drip', label: 'Content Drip', icon: CalendarClock },
      { href: '/learn/ai-studio', label: 'AI Studio', icon: Sparkles },
      { href: '/learn/bundles', label: 'Course Bundles', icon: Package },
      { href: '/learn/commerce', label: 'eCommerce', icon: ShoppingBag },
      { href: '/learn/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/learn/certificates', label: 'Certificates', icon: Award },
      { href: '/learn/prerequisites', label: 'Prerequisites', icon: GitBranch },
      { href: '/learn/subscriptions', label: 'Subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'Classroom',
    items: [
      { href: '/classroom', label: 'Classroom Hub', icon: School, exact: true },
    ],
  },
  {
    label: 'Startup',
    items: [{ href: '/startup', label: 'Startup hub', icon: Rocket, exact: true }],
  },
  {
    label: 'Training',
    items: [
      { href: '/training', label: 'Skills Training', icon: Dumbbell, exact: true },
      { href: '/training/certificates', label: 'Certificates (legacy)', icon: Award },
    ],
  },
  {
    label: 'Learning',
    items: [{ action: 'chat', label: 'AI Assistant', icon: Bot, badge: 'Live' }],
  },
  {
    label: 'Account',
    items: [
      { href: '/account', label: 'Account & billing', icon: Settings },
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
  '/learn': 'My Learning',
  '/learn/path': 'Adaptive Path',
  '/learn/study': 'Study Lab',
  '/learn/notes': 'Notes Vault',
  '/learn/search': 'Search',
  '/learn/assignments': 'Assignments',
  '/learn/gradebook': 'Gradebook',
  '/learn/live-classes': 'Live Classes',
  '/learn/lessons': 'Lessons & Quizzes',
  '/learn/content-drip': 'Content Drip',
  '/learn/ai-studio': 'AI Studio',
  '/learn/bundles': 'Course Bundles',
  '/learn/commerce': 'eCommerce',
  '/learn/analytics': 'Analytics',
  '/learn/certificates': 'Certificates',
  '/learn/prerequisites': 'Prerequisites',
  '/learn/subscriptions': 'Subscriptions',
  '/learn/courses': 'Courses',
  '/verify': 'Verify certificate',
  '/classroom': 'Classroom Hub',
  '/courses': 'Courses',
  '/account': 'Account',
  '/profile': 'Profile',
  '/leaderboard': 'Leaderboard',
  '/training': 'Skills Training',
  '/training/certificates': 'Certificates',
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
  if (pathname.startsWith('/training/') && pathname !== '/training/certificates') {
    return 'Training Program';
  }
  if (pathname.startsWith('/verify/')) return 'Verify certificate';
  if (pathname.startsWith('/learn/')) return 'Learning tools';
  return 'Peer Academy';
}

