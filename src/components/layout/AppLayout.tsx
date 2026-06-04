'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ChatbotProvider } from '@/hooks/use-chatbot';
import { Chatbot } from '@/components/chat/Chatbot';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLessonCanvas = /^\/courses\/[^/]+\/[^/]+$/.test(pathname ?? '');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ChatbotProvider>
      <SidebarProvider className="dashboard-shell min-h-svh">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-svh">
          <DashboardHeader />
          <main
            className={cn(
              'flex-1 overflow-auto p-3 main-safe-pad sm:p-4 md:p-6 lg:p-8',
              isLessonCanvas && 'bg-canvas'
            )}
          >
            {children}
          </main>
          <Chatbot />
        </SidebarInset>
      </SidebarProvider>
    </ChatbotProvider>
  );
}

