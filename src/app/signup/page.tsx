'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { InstructorSignUpForm } from '@/components/auth/InstructorSignUpForm';
import { SignupPathPicker } from '@/components/auth/SignupPathPicker';
import { SignupAuthFooter } from '@/components/auth/SignupAuthFooter';
import { AuthShell } from '@/components/marketing/auth-shell';
import { useAuth } from '@/hooks/use-auth';
import { setPendingSignupPath, type SignupPath } from '@/lib/firebase';
import { getPostAuthRedirect } from '@/lib/role-routes';
import { Loader2 } from 'lucide-react';

function parseSignupPath(value: string | null): SignupPath {
  if (value === 'founder' || value === 'instructor' || value === 'learner') return value;
  return 'learner';
}

function SignUpPageInner() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPath = parseSignupPath(searchParams.get('path'));
  const [signupPath, setSignupPath] = useState<SignupPath>(initialPath);

  useEffect(() => {
    setSignupPath(parseSignupPath(searchParams.get('path')));
  }, [searchParams]);

  useEffect(() => {
    setPendingSignupPath(signupPath);
  }, [signupPath]);

  const handlePathChange = (path: SignupPath) => {
    setSignupPath(path);
    router.replace(`/signup?path=${path}`, { scroll: false });
  };

  useEffect(() => {
    if (loading || !user || !userProfile) return;
    if (signupPath === 'founder') {
      router.replace('/startup');
      return;
    }
    router.replace(getPostAuthRedirect(userProfile, user.email));
  }, [user, userProfile, loading, router, signupPath]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const descriptions: Record<SignupPath, string> = {
    learner: 'Join as a learner — courses, classroom, leaderboard, and AI tutoring.',
    founder: 'Join as a founder — startup ideas, pitch reviews, mentorship, and Founder AI.',
    instructor: 'Join as an instructor — build classrooms and guide learners.',
  };

  return (
    <AuthShell
      wide
      title="Create your account"
      description={descriptions[signupPath]}
      footer={<SignupAuthFooter />}
    >
      <div className="space-y-8">
        <SignupPathPicker value={signupPath} onChange={handlePathChange} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              {signupPath === 'instructor' ? 'Instructor details' : 'Your details'}
            </span>
          </div>
        </div>

        {signupPath === 'instructor' ? (
          <InstructorSignUpForm />
        ) : (
          <SignUpForm signupPath={signupPath} />
        )}

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{' '}
          <Link href="/" className="text-primary hover:underline">
            terms of use
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <SignUpPageInner />
    </Suspense>
  );
}
