'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ChatbotProvider } from '@/hooks/use-chatbot';
import { Chatbot } from '@/components/chat/Chatbot';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { SiteHeader } from '@/components/marketing/site-header';
import { isPublicCatalogCoursePath } from '@/lib/public-routes';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLessonCanvas = /^\/courses\/[^/]+\/[^/]+$/.test(pathname ?? '');
  const isPublicCourse = isPublicCatalogCoursePath(pathname);
  const allowGuest = isPublicCourse && !user;

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicCourse) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirect}`);
    }
  }, [user, loading, router, pathname, isPublicCourse]);

  // While auth resolves on a public course page, show guest chrome immediately
  // so marketplace "View course" never hits a login wall.
  if (loading && isPublicCourse) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <SiteHeader />
        <main
          className={cn(
            'course-public-main container flex-1 py-6 sm:py-8 md:py-10',
            isLessonCanvas && 'max-w-6xl'
          )}
        >
          {children}
        </main>
      </div>
    );
  }

  // Guest browsing a public catalog course — marketing chrome, no login wall
  if (!loading && allowGuest) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <SiteHeader />
        <main
          className={cn(
            'course-public-main container flex-1 py-6 sm:py-8 md:py-10',
            isLessonCanvas && 'max-w-6xl'
          )}
        >
          {children}
        </main>
        <footer className="border-t border-royal/10 bg-chalk/80 py-6">
          <div className="container flex flex-col gap-3 text-sm text-slate-dark sm:flex-row sm:items-center sm:justify-between">
            <p>Browse freely — create an account to save progress and earn certificates.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/marketplace" className="font-medium text-royal hover:underline">
                Marketplace
              </Link>
              <Link href="/login" className="font-medium text-royal hover:underline">
                Log in
              </Link>
              <Link href="/signup" className="font-medium text-royal hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

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
