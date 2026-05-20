'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { TeachModeContent } from '@/components/teach/TeachModeContent';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';

export default function TeachPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading || !user || !userProfile) return;
    if (isInstructorOrAdmin(userProfile, user.email)) {
      router.replace('/instructor/teach');
    }
  }, [user, userProfile, loading, router]);

  return (
    <AppLayout>
      <TeachModeContent />
    </AppLayout>
  );
}
