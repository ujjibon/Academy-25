'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthShell } from '@/components/marketing/auth-shell';
import { SignupAuthFooter } from '@/components/auth/SignupAuthFooter';
import { useAuth } from '@/hooks/use-auth';
import { getPostAuthRedirect } from '@/lib/role-routes';
import { Loader2 } from 'lucide-react';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (loading || !user || !userProfile) return;
    const defaultHome = getPostAuthRedirect(userProfile, user.email);
    const safe =
      redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : defaultHome;
    router.replace(safe);
  }, [user, userProfile, loading, router, redirectTo]);

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
      description="Sign in to your Peer Academy account."
      headerAction={
        <Link
          href="/signup"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Sign up
        </Link>
      }
      footer={
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            New here?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <SignupAuthFooter mode="login" />
        </div>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
