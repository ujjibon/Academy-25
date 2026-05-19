'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthShell } from '@/components/marketing/auth-shell';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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
      title="Welcome back"
      description="Sign in to continue your learning journey on Peer Academy."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:text-royal-light">
            Sign up
          </Link>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <Link href="/instructor/login" className="font-medium text-muted-foreground hover:text-foreground">
            Instructor sign in
          </Link>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <Link href="/admin/login" className="font-medium text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
