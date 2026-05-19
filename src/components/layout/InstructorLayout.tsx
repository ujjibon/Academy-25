'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';
import { InstructorSidebar } from '@/components/layout/InstructorSidebar';
import { InstructorHeader } from '@/components/layout/InstructorHeader';

export default function InstructorLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/instructor/login');
      return;
    }
    if (!loading && user && userProfile && !isInstructorOrAdmin(userProfile, user.email)) {
      router.replace('/dashboard');
    }
  }, [user, userProfile, loading, router]);

  if (loading || !user || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isInstructorOrAdmin(userProfile, user.email)) {
    return null;
  }

  return (
    <SidebarProvider className="dashboard-shell min-h-svh">
      <InstructorSidebar />
      <SidebarInset className="flex flex-col min-h-svh">
        <InstructorHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
