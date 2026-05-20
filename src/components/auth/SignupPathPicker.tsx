'use client';

import type { SignupPath } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { GraduationCap, Rocket, Presentation } from 'lucide-react';

const paths: {
  id: SignupPath;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}[] = [
  {
    id: 'learner',
    label: 'Learner',
    description: 'Courses, classroom, and AI tutoring',
    icon: GraduationCap,
  },
  {
    id: 'founder',
    label: 'Founder',
    description: 'Startup hub — ideas, pitch deck, mentorship',
    icon: Rocket,
  },
  {
    id: 'instructor',
    label: 'Instructor',
    description: 'Teach classes, assign work, use AI tools',
    icon: Presentation,
  },
];

type Props = {
  value: SignupPath;
  onChange: (path: SignupPath) => void;
};

export function SignupPathPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-foreground">I am signing up as a</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {paths.map(({ id, label, description, icon: Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all',
                'hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-background-elevated/50'
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  'mb-3 flex h-12 w-12 items-center justify-center rounded-xl border',
                  selected ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground'
                )}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="font-semibold text-foreground">{label}</span>
              <span className="mt-1 text-xs leading-snug text-muted-foreground">{description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
