'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getPostAuthRedirect } from '@/lib/role-routes';

/** Redirects signed-in users to the correct dashboard for their role. */
export function HomeAuthRedirect() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user || !userProfile) return;
    router.replace(getPostAuthRedirect(userProfile, user.email));
  }, [user, userProfile, loading, router]);

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
