'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminAuthShell } from '@/components/marketing/admin-auth-shell';
import { AdminLoginForm } from '@/components/auth/AdminLoginForm';
import { useAuth } from '@/hooks/use-auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, userProfile, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && userProfile && isAdmin) {
      router.replace('/admin-portal');
    }
  }, [user, userProfile, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user && userProfile && isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminAuthShell
      title="Admin sign in"
      footer={
        <>
          Learner account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-royal-light">
            Sign in here
          </Link>
        </>
      }
    >
      <AdminLoginForm />
    </AdminAuthShell>
  );
}

