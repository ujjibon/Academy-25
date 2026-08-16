'use client';

import Link from 'next/link';
import { GraduationCap, Presentation, Rocket, Shield } from 'lucide-react';

type Props = { mode?: 'signup' | 'login' };

export function SignupAuthFooter({ mode = 'signup' }: Props) {
  const isSignup = mode === 'signup';

  if (isSignup) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="text-[0.65rem] uppercase tracking-wider opacity-70">Portals</span>
          <Link
            href="/instructor/login"
            className="inline-flex items-center gap-1 transition-colors hover:text-primary"
          >
            <Presentation className="h-3 w-3" />
            Instructor
          </Link>
          <span aria-hidden className="text-border">
            ·
          </span>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1 transition-colors hover:text-primary"
          >
            <Shield className="h-3 w-3" />
            Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Or sign up as</span>
        <Link
          href="/signup?path=learner"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Learner
        </Link>
        <span aria-hidden className="text-border">
          ·
        </span>
        <Link
          href="/signup?path=founder"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <Rocket className="h-3.5 w-3.5" />
          Founder
        </Link>
        <span aria-hidden className="text-border">
          ·
        </span>
        <Link
          href="/signup?path=instructor"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <Presentation className="h-3.5 w-3.5" />
          Instructor
        </Link>
      </div>
    </div>
  );
}
