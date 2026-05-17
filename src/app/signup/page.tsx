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
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-royal-light">
            Log in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
