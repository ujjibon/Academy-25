'use client';

import type { SignupPath } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { BookOpen, Check, Presentation, Rocket } from 'lucide-react';

const paths: {
  id: SignupPath;
  label: string;
  tagline: string;
  highlights: string[];
  icon: typeof BookOpen;
  accent: 'learner' | 'founder' | 'instructor';
}[] = [
  {
    id: 'learner',
    label: 'Learner',
    tagline: 'Courses, classroom & AI tutoring',
    highlights: ['Learn', 'Practice', 'Level up'],
    icon: BookOpen,
    accent: 'learner',
  },
  {
    id: 'founder',
    label: 'Founder',
    tagline: 'Ideas, pitch deck & mentorship',
    highlights: ['Ideate', 'Pitch', 'Launch'],
    icon: Rocket,
    accent: 'founder',
  },
  {
    id: 'instructor',
    label: 'Instructor',
    tagline: 'Classes, assignments & AI tools',
    highlights: ['Teach', 'Guide', 'Inspire'],
    icon: Presentation,
    accent: 'instructor',
  },
];

type Props = {
  value: SignupPath;
  onChange: (path: SignupPath) => void;
};

function PathArt({ accent }: { accent: 'learner' | 'founder' | 'instructor' }) {
  if (accent === 'learner') {
    return (
      <svg className="auth-path-art" viewBox="0 0 160 88" aria-hidden>
        <circle cx="128" cy="18" r="28" fill="currentColor" opacity="0.18" />
        <circle cx="22" cy="70" r="18" fill="currentColor" opacity="0.12" />
        <path
          d="M18 58c18-22 42-22 60 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.35"
        />
        <path
          d="M34 48c12-14 28-14 40 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.25"
        />
        <rect x="96" y="42" width="36" height="28" rx="6" fill="currentColor" opacity="0.22" />
        <rect x="102" y="48" width="24" height="3" rx="1.5" fill="#fff" opacity="0.55" />
        <rect x="102" y="55" width="16" height="3" rx="1.5" fill="#fff" opacity="0.35" />
      </svg>
    );
  }

  if (accent === 'founder') {
    return (
      <svg className="auth-path-art" viewBox="0 0 160 88" aria-hidden>
        <circle cx="30" cy="22" r="22" fill="currentColor" opacity="0.16" />
        <circle cx="138" cy="66" r="26" fill="currentColor" opacity="0.14" />
        <path
          d="M28 70 L72 28 L88 44 L130 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
        <circle cx="130" cy="14" r="4" fill="#fff" opacity="0.7" />
        <path d="M108 58 l18-8 8 18-18 8z" fill="currentColor" opacity="0.28" />
      </svg>
    );
  }

  return (
    <svg className="auth-path-art" viewBox="0 0 160 88" aria-hidden>
      <circle cx="140" cy="20" r="30" fill="currentColor" opacity="0.16" />
      <circle cx="18" cy="64" r="16" fill="currentColor" opacity="0.12" />
      <rect x="36" y="28" width="70" height="44" rx="8" fill="currentColor" opacity="0.22" />
      <rect x="44" y="36" width="54" height="6" rx="3" fill="#fff" opacity="0.45" />
      <rect x="44" y="48" width="38" height="4" rx="2" fill="#fff" opacity="0.28" />
      <rect x="44" y="56" width="46" height="4" rx="2" fill="#fff" opacity="0.22" />
      <circle cx="118" cy="56" r="10" fill="#fff" opacity="0.2" />
    </svg>
  );
}

export function SignupPathPicker({ value, onChange }: Props) {
  return (
    <fieldset className="space-y-3.5">
      <legend className="sr-only">Choose your sign-up path</legend>
      <div>
        <p className="text-sm font-semibold tracking-tight text-foreground">I want to join as</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Pick the experience that fits you</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Sign-up path">
        {paths.map(({ id, label, tagline, highlights, icon: Icon, accent }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-pressed={selected}
              onClick={() => onChange(id)}
              data-accent={accent}
              className={cn('auth-path-card', selected && 'is-selected')}
            >
              <div className="auth-path-stage" aria-hidden>
                <PathArt accent={accent} />
                <span className="auth-path-icon">
                  <Icon className="h-6 w-6" strokeWidth={2.25} />
                </span>
                <span className="auth-path-check">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              </div>

              <div className="auth-path-body">
                <span className="auth-path-label">{label}</span>
                <span className="auth-path-tagline">{tagline}</span>
                <ul className="auth-path-chips">
                  {highlights.map((item) => (
                    <li key={item} className="auth-path-chip">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
