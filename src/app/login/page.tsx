'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthShell } from '@/components/marketing/auth-shell';
import { SignupAuthFooter } from '@/components/auth/SignupAuthFooter';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (loading || !user) return;
    if (userProfile && isInstructorOrAdmin(userProfile, user.email)) {
      router.replace('/instructor/dashboard');
      return;
    }
    const safe =
      redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard';
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
      wide
      title="Welcome back"
      description="Sign in to your Peer Academy account."
      footer={
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">New here?</p>
          <Button className="w-full h-11 rounded-2xl brand-button" asChild>
            <Link href="/signup">
              <UserPlus className="mr-2 h-4 w-4" />
              Create an account
            </Link>
          </Button>
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
