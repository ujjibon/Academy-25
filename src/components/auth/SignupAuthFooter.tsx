'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, GraduationCap, Rocket, Presentation, Shield } from 'lucide-react';

type Props = { mode?: 'signup' | 'login' };

export function SignupAuthFooter({ mode = 'signup' }: Props) {
  const isSignup = mode === 'signup';

  return (
    <div className="space-y-4">
      {isSignup ? (
        <>
          <p className="text-center text-sm text-muted-foreground">Already have an account?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="h-11 rounded-2xl w-full" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Log in
              </Link>
            </Button>
            <Button variant="outline" className="h-11 rounded-2xl w-full" asChild>
              <Link href="/instructor/login">
                <Presentation className="mr-2 h-4 w-4" />
                Instructor sign in
              </Link>
            </Button>
          </div>
        </>
      ) : null}

      {!isSignup ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" className="h-11 rounded-2xl w-full" asChild>
            <Link href="/signup?path=learner">
              <GraduationCap className="mr-2 h-4 w-4" />
              Learner sign up
            </Link>
          </Button>
          <Button variant="outline" className="h-11 rounded-2xl w-full" asChild>
            <Link href="/signup?path=founder">
              <Rocket className="mr-2 h-4 w-4" />
              Founder sign up
            </Link>
          </Button>
        </div>
      ) : null}
      <p className="text-center text-xs text-muted-foreground pt-1">
        {isSignup ? 'Sign in as' : 'Sign in to'}
      </p>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
        <Button variant="secondary" size="sm" className="rounded-xl h-10" asChild>
          <Link href="/login">
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Learner
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-xl h-10" asChild>
          <Link href="/login?redirect=/startup">
            <Rocket className="mr-1.5 h-3.5 w-3.5" />
            Founder
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-xl h-10" asChild>
          <Link href="/instructor/login">
            <Presentation className="mr-1.5 h-3.5 w-3.5" />
            Instructor
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-xl h-10" asChild>
          <Link href="/admin/login">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Admin
          </Link>
        </Button>
      </div>
    </div>
  );
}
