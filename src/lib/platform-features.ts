import type { LucideIcon } from 'lucide-react';

import {

  Award,

  BarChart3,

  BookOpenCheck,

  CalendarClock,

  ClipboardList,

  CreditCard,

  GitBranch,

  LayoutDashboard,

  Package,

  ShoppingBag,

  Sparkles,

  Table2,

  Video,

} from 'lucide-react';



export type PlatformFeatureId =

  | 'course-builder'

  | 'assignments'

  | 'content-drip'

  | 'lessons-quizzes'

  | 'live-classes'

  | 'ai-studio'

  | 'course-bundles'

  | 'ecommerce'

  | 'gradebook'

  | 'subscriptions'

  | 'certificates'

  | 'prerequisites'

  | 'analytics';



export type PlatformFeature = {

  id: PlatformFeatureId;

  title: string;

  description: string;

  icon: LucideIcon;

  instructorHref: string;

  learnerHref: string;

  highlight?: string;

};



/** Every tool has its own route under /instructor/* and /learn/* */

export const PLATFORM_FEATURES: PlatformFeature[] = [

  {

    id: 'course-builder',

    title: 'Course Builder',

    description: 'Design courses and curriculums with modules, lessons, and projects.',

    icon: LayoutDashboard,

    instructorHref: '/instructor/course-builder',

    learnerHref: '/learn/courses',

    highlight: 'Create',

  },

  {

    id: 'assignments',

    title: 'Assignments',

    description: 'Structured tasks with deadlines, submissions, and grading.',

    icon: ClipboardList,

    instructorHref: '/instructor/assignments',

    learnerHref: '/learn/assignments',

  },

  {

    id: 'content-drip',

    title: 'Content Drip',

    description: 'Schedule module releases so learners unlock content over time.',

    icon: CalendarClock,

    instructorHref: '/instructor/content-drip',

    learnerHref: '/learn/content-drip',

  },

  {

    id: 'lessons-quizzes',

    title: 'Lessons & Quizzes',

    description: 'Interactive lessons with practice checks and assessments.',

    icon: BookOpenCheck,

    instructorHref: '/instructor/lessons',

    learnerHref: '/learn/lessons',

  },

  {

    id: 'live-classes',

    title: 'Live Classes',

    description: 'Run cohorts with stream, classwork, and real-time classroom tools.',

    icon: Video,

    instructorHref: '/instructor/live-classes',

    learnerHref: '/learn/live-classes',

    highlight: 'Classroom',

  },

  {

    id: 'ai-studio',

    title: 'AI Studio',

    description: 'Generate courses, bootcamps, and slides with AI.',

    icon: Sparkles,

    instructorHref: '/instructor/ai-studio',

    learnerHref: '/learn/ai-studio',

    highlight: 'AI',

  },

  {

    id: 'course-bundles',

    title: 'Course Bundles',

    description: 'Package multiple courses into structured learning paths.',

    icon: Package,

    instructorHref: '/instructor/bundles',

    learnerHref: '/learn/bundles',

  },

  {

    id: 'ecommerce',

    title: 'Native eCommerce',

    description: 'Set course prices and sell access through the platform.',

    icon: ShoppingBag,

    instructorHref: '/instructor/commerce',

    learnerHref: '/marketplace',

  },

  {

    id: 'gradebook',

    title: 'Gradebook',

    description: 'Track assignment scores and academic performance.',

    icon: Table2,

    instructorHref: '/instructor/gradebook',

    learnerHref: '/learn/gradebook',

  },

  {

    id: 'subscriptions',

    title: 'Subscriptions',

    description: 'Recurring Pro and Premium plans via PayPal billing.',

    icon: CreditCard,

    instructorHref: '/instructor/subscriptions',

    learnerHref: '/learn/subscriptions',

  },

  {

    id: 'certificates',

    title: 'Certificate Builder',

    description: 'Award PDF certificates when learners complete programs.',

    icon: Award,

    instructorHref: '/instructor/certificates',

    learnerHref: '/learn/certificates',

  },

  {

    id: 'prerequisites',

    title: 'Prerequisites',

    description: 'Require completion of prior courses before enrollment.',

    icon: GitBranch,

    instructorHref: '/instructor/prerequisites',

    learnerHref: '/learn/prerequisites',

  },

  {

    id: 'analytics',

    title: 'Analytics',

    description: 'Track enrollments, submissions, and course performance.',

    icon: BarChart3,

    instructorHref: '/instructor/analytics',

    learnerHref: '/learn/analytics',

  },

];



export function getFeatureById(id: PlatformFeatureId): PlatformFeature | undefined {

  return PLATFORM_FEATURES.find((f) => f.id === id);

}


