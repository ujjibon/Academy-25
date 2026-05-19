'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { InstructorAuthShell } from '@/components/marketing/instructor-auth-shell';
import { InstructorSignUpForm } from '@/components/auth/InstructorSignUpForm';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';

export default function InstructorSignUpPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && userProfile && isInstructorOrAdmin(userProfile, user.email)) {
      router.replace('/instructor/dashboard');
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user && userProfile && isInstructorOrAdmin(userProfile, user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <InstructorAuthShell
      title="Become an instructor"
      description="Create your instructor account to build classrooms, assign work, and guide learners with AI tools."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/instructor/login" className="font-medium text-primary hover:text-royal-light">
            Sign in
          </Link>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <Link href="/signup" className="font-medium text-muted-foreground hover:text-foreground">
            Learner sign up
          </Link>
        </>
      }
    >
      <InstructorSignUpForm />
    </InstructorAuthShell>
  );
}
