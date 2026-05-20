'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, GraduationCap, Rocket, Presentation, Shield } from 'lucide-react';

type Props = { mode?: 'signup' | 'login' };

export function SignupAuthFooter({ mode = 'signup' }: Props) {
  const isSignup = mode === 'signup';

  return (
    <div className="space-y-3">
      {isSignup ? (
        <>
          <p className="text-center text-sm text-muted-foreground">Already have an account?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="h-10 rounded-xl w-full text-sm" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Log in
              </Link>
            </Button>
            <Button variant="outline" className="h-10 rounded-xl w-full text-sm" asChild>
              <Link href="/instructor/login">
                <Presentation className="mr-2 h-4 w-4" />
                Instructor sign in
              </Link>
            </Button>
          </div>
        </>
      ) : (
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
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {isSignup ? 'Sign in as' : 'Sign in to'}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        <Button variant="secondary" size="sm" className="h-8 rounded-lg px-2.5 text-xs" asChild>
          <Link href="/login">
            <GraduationCap className="mr-1 h-3 w-3" />
            Learner
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="h-8 rounded-lg px-2.5 text-xs" asChild>
          <Link href="/login?redirect=/startup">
            <Rocket className="mr-1 h-3 w-3" />
            Founder
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="h-8 rounded-lg px-2.5 text-xs" asChild>
          <Link href="/instructor/login">
            <Presentation className="mr-1 h-3 w-3" />
            Instructor
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="h-8 rounded-lg px-2.5 text-xs" asChild>
          <Link href="/admin/login">
            <Shield className="mr-1 h-3 w-3" />
            Admin
          </Link>
        </Button>
      </div>
    </div>
  );
}
