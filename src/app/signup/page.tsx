'use client';

import Link from 'next/link';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AuthShell } from '@/components/marketing/auth-shell';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start your learning journey with Peer Academy today."
      footer={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-muted-foreground">Already have an account?</span>
            <Link
              href="/login"
              className="rounded-full border border-primary/30 px-3 py-1 font-medium text-primary transition-colors hover:bg-primary/10"
            >
              Log in
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/instructor/signup"
              className="rounded-full border border-border px-3 py-1 font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Instructor sign up
            </Link>
            <Link
              href="/instructor/login"
              className="rounded-full border border-border px-3 py-1 font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Instructor sign in
            </Link>
            <Link
              href="/admin/login"
              className="rounded-full border border-border px-3 py-1 font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Admin login
            </Link>
          </div>
        </div>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
