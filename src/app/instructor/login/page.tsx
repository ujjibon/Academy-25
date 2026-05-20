'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { InstructorAuthShell } from '@/components/marketing/instructor-auth-shell';
import { InstructorLoginForm } from '@/components/auth/InstructorLoginForm';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';

export default function InstructorLoginPage() {
  const router = useRouter();
  const { user, userProfile, loading, connectionError } = useAuth();

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
      title="Instructor sign in"
      description="Access your teaching dashboard to manage courses, assignments, and student progress."
      footer={
        <>
          New instructor?{' '}
          <Link href="/instructor/signup" className="font-medium text-primary hover:text-royal-light">
            Create account
          </Link>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <Link href="/login" className="font-medium text-muted-foreground hover:text-foreground">
            Learner sign in
          </Link>
        </>
      }
    >
      {connectionError ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {connectionError}
        </p>
      ) : null}
      <InstructorLoginForm />
    </InstructorAuthShell>
  );
}
