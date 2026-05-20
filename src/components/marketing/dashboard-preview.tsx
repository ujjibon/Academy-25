'use client';

import {
  BookOpen,
  Flame,
  LayoutDashboard,
  School,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PreviewView = 'dashboard' | 'classroom' | 'training';

interface DashboardPreviewProps {
  view: PreviewView;
  className?: string;
}

const courses = [
  { title: 'React Fundamentals', progress: 68, color: 'bg-primary' },
  { title: 'TypeScript Essentials', progress: 42, color: 'bg-primary/70' },
  { title: 'UI Design Systems', progress: 24, color: 'bg-accent' },
];

const skills = [
  { name: 'Problem solving', level: 82 },
  { name: 'Communication', level: 74 },
  { name: 'Technical depth', level: 61 },
];

export function DashboardPreview({ view, className }: DashboardPreviewProps) {
  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden bg-background text-[10px] leading-tight sm:text-[11px]',
        className
      )}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-border/80 bg-background-elevated/60 px-2.5">
        <span className="h-2 w-2 rounded-full bg-accent/80" />
        <span className="h-2 w-2 rounded-full bg-slate/60" />
        <span className="h-2 w-2 rounded-full bg-primary/40" />
        <span className="ml-2 truncate font-medium text-foreground/80">
          peer-academy.app
        </span>
      </div>

      <div className="flex h-[calc(100%-1.75rem)]">
        <aside className="hidden w-[22%] shrink-0 border-r border-border/60 bg-background-elevated/40 p-2 sm:block">
          <p className="mb-2 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
            Main
          </p>
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: view === 'dashboard' },
            { icon: School, label: 'Classroom', active: view === 'classroom' },
            { icon: Zap, label: 'Training', active: view === 'training' },
            { icon: Trophy, label: 'Leaderboard', active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                'mb-1 flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors',
                item.active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden p-2.5 sm:p-3">
          {view === 'dashboard' && <DashboardView />}
          {view === 'classroom' && <ClassroomView />}
          {view === 'training' && <TrainingView />}
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-2.5 animate-fade-in">
      <div className="rounded-xl border border-border/80 bg-card p-2.5 shadow-sm">
        <span className="inline-flex rounded-full border border-border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
          Learning workspace
        </span>
        <p className="mt-1.5 font-dashboard-title text-sm font-bold tracking-tight text-foreground">
          Good to see you, Alex.
        </p>
        <div className="mt-2 flex gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-white">
            <Zap className="h-2.5 w-2.5" />
            Continue
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[9px] text-foreground">
            <BookOpen className="h-2.5 w-2.5" />
            Courses
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <MiniStatCard
          label="Profile strength"
          value="87%"
          sub="AI readiness"
          variant="royal"
        />
        <MiniStatCard
          label="Course progress"
          value="68%"
          sub="React Fundamentals"
          variant="muted"
        />
        <MiniStatCard
          label="Streak"
          value="12 days"
          sub="3 courses active"
          variant="flare"
        />
      </div>

      <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">AI Coach</span>
          </div>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-medium text-primary">
            Live
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">
          Finish Module 3 today to keep your streak — I&apos;ve queued a quick quiz.
        </p>
      </div>
    </div>
  );
}

function ClassroomView() {
  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="font-dashboard-title text-sm font-bold text-foreground">
          Your classrooms
        </p>
        <span className="text-[9px] text-muted-foreground">3 active</span>
      </div>
      {courses.map((course) => (
        <div
          key={course.title}
          className="rounded-xl border border-border/80 bg-card p-2 transition-colors hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{course.title}</p>
              <p className="text-[9px] text-muted-foreground">Stream · Classwork · Grades</p>
            </div>
            <span className="font-bold text-primary">{course.progress}%</span>
          </div>
          <div className="progress-brand mt-2 h-1">
            <div
              className={cn('progress-brand-fill', course.color)}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrainingView() {
  return (
    <div className="space-y-2.5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="font-dashboard-title text-sm font-bold text-foreground">
          Skills training
        </p>
        <Flame className="h-4 w-4 text-accent" />
      </div>
      {skills.map((skill) => (
        <div
          key={skill.name}
          className="rounded-xl border border-border/80 bg-background-elevated/50 p-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{skill.name}</span>
            <span className="text-[9px] font-semibold text-primary">{skill.level}%</span>
          </div>
          <div className="progress-brand mt-1.5 h-1">
            <div
              className="progress-brand-fill"
              style={{ width: `${skill.level}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] p-2">
        <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-[9px] text-muted-foreground">
          +240 XP earned this week — you&apos;re in the top 15% of learners.
        </p>
      </div>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  sub,
  variant,
}: {
  label: string;
  value: string;
  sub: string;
  variant: 'royal' | 'muted' | 'flare';
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-1.5 text-white',
        variant === 'royal' && 'stat-card-royal',
        variant === 'muted' && 'stat-card-muted !text-foreground',
        variant === 'flare' && 'stat-card-flare'
      )}
    >
      <p
        className={cn(
          'text-[7px] font-semibold uppercase tracking-wide opacity-80',
          variant === 'muted' && 'text-muted-foreground opacity-100'
        )}
      >
        {label}
      </p>
      <p className="font-dashboard-title text-xs font-bold leading-none">{value}</p>
      <p
        className={cn(
          'mt-0.5 text-[7px] opacity-75',
          variant === 'muted' && 'text-muted-foreground opacity-100'
        )}
      >
        {sub}
      </p>
    </div>
  );
}
