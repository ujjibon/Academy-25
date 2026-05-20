'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  ClipboardList,
  CreditCard,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Package,
  Rocket,
  ShoppingBag,
  Sparkles,
  Table2,
  Trophy,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FeatureCategory = 'all' | 'create' | 'classroom' | 'monetize' | 'ai';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  category: Exclude<FeatureCategory, 'all'>;
  highlight?: string;
}

const categories: { id: FeatureCategory; label: string }[] = [
  { id: 'all', label: 'All features' },
  { id: 'create', label: 'Create & teach' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'monetize', label: 'Monetize' },
  { id: 'ai', label: 'AI & insights' },
];

const features: Feature[] = [
  {
    icon: LayoutDashboard,
    title: 'Course Builder',
    description:
      'Visually design courses and curriculums—modules, lessons, quizzes, and projects—in the manual course studio or AI course creator.',
    category: 'create',
    highlight: 'Instructor tools',
  },
  {
    icon: ClipboardList,
    title: 'Assignments',
    description:
      'Structured tasks for skill application with due dates, submissions, rubrics, and instructor grading in every classroom.',
    category: 'classroom',
  },
  {
    icon: CalendarClock,
    title: 'Content Drip',
    description:
      'Scheduled content release with bootcamp weekly plans and paced module unlocks so learners progress on your timeline.',
    category: 'create',
  },
  {
    icon: BookOpenCheck,
    title: 'Lessons & Quizzes',
    description:
      'Design rich lessons with practice checks and end-of-lesson assessments across the interactive course catalog.',
    category: 'create',
  },
  {
    icon: Video,
    title: 'Live Classes',
    description:
      'Live classes for real-time learning—stream updates, classwork, grades, and cohort management in one workspace.',
    category: 'classroom',
    highlight: 'Classroom hub',
  },
  {
    icon: Sparkles,
    title: 'AI Studio',
    description:
      'Generate courses, bootcamp designs, classroom slides, and feature visuals with Gemini-powered AI flows.',
    category: 'ai',
    highlight: 'Gemini powered',
  },
  {
    icon: Package,
    title: 'Course Bundles',
    description:
      'Bundle related courses into structured learning paths so learners follow a complete curriculum in sequence.',
    category: 'monetize',
  },
  {
    icon: ShoppingBag,
    title: 'Native eCommerce',
    description:
      'Sell courses easily with native eCommerce—catalog browsing, plan tiers, and PayPal checkout built into the platform.',
    category: 'monetize',
  },
  {
    icon: Table2,
    title: 'Gradebook',
    description:
      'Academic performance tracking with classroom grade views, submission status, and per-student assignment progress.',
    category: 'classroom',
  },
  {
    icon: CreditCard,
    title: 'Subscriptions',
    description:
      'Create recurring revenue with built-in Pro and Premium subscriptions managed through PayPal billing.',
    category: 'monetize',
  },
  {
    icon: Award,
    title: 'Certificate Builder',
    description:
      'Award customized PDF certificates when learners complete skill training and course milestones.',
    category: 'create',
  },
  {
    icon: GitBranch,
    title: 'Prerequisites',
    description:
      'Essential pre-learning criteria—AI learning guides map prerequisite skills and recommended prep before advanced topics.',
    category: 'classroom',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Track course progress and performance with instructor dashboards for enrollments, assignments, and submissions.',
    category: 'ai',
  },
  {
    icon: BrainCircuit,
    title: 'AI Personal Coach',
    description:
      'Personalized task suggestions, instant answers, and feedback that adapts to your pace and learning goals.',
    category: 'ai',
    highlight: 'Live assistant',
  },
  {
    icon: GraduationCap,
    title: 'Skills Training',
    description:
      'Dedicated skill tracks with structured modules and completion certificates—build job-ready competencies step by step.',
    category: 'create',
  },
  {
    icon: Rocket,
    title: 'Startup Hub',
    description:
      'Pitch decks, idea validation, mentorship bookings, and AI tools for aspiring founders on Premium plans.',
    category: 'monetize',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description:
      'Gamified XP, badges, and friendly competition keep learners motivated across the academy community.',
    category: 'classroom',
  },
];

export function FeaturesSection() {
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setHoveredIndex(null);
  }, [activeCategory]);

  const filtered =
    activeCategory === 'all'
      ? features
      : features.filter((f) => f.category === activeCategory);

  return (
    <section id="features" className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-64 w-[480px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <span className="dashboard-kicker mb-4 mx-auto flex">Platform</span>
          <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
            Everything you need to{' '}
            <span className="serif-italic gradient-text">teach and sell</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-balance">
            From course building and live classrooms to AI generation, gradebooks,
            certificates, and subscriptions—Peer Academy is a full learning platform
            for instructors and learners.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                activeCategory === cat.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {filtered.map((feature, i) => (
            <article
              key={feature.title}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                'feature-card-interactive group relative flex flex-col overflow-hidden p-6',
                hoveredIndex === i && 'feature-card-active'
              )}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  {feature.highlight && (
                    <span className="badge-royal shrink-0">{feature.highlight}</span>
                  )}
                </div>
                <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No features in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}
