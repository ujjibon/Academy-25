'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';
import { ChatbotProvider } from '@/hooks/use-chatbot';
import { Chatbot } from '@/components/chat/Chatbot';
import { InstructorSidebar } from '@/components/layout/InstructorSidebar';
import { InstructorHeader } from '@/components/layout/InstructorHeader';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function InstructorLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, connectionError, retryConnection, isInstructor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/instructor/login');
      return;
    }
    if (userProfile && !isInstructorOrAdmin(userProfile, user.email)) {
      router.replace('/dashboard');
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Could not load instructor profile</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{connectionError}</p>
            <Button variant="outline" size="sm" onClick={() => retryConnection()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isInstructor) {
    return null;
  }

  return (
    <ChatbotProvider>
      <SidebarProvider className="dashboard-shell min-h-svh">
        <InstructorSidebar />
        <SidebarInset className="flex flex-col min-h-svh">
          <InstructorHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
          <Chatbot mode="instructor" />
        </SidebarInset>
      </SidebarProvider>
    </ChatbotProvider>
  );
}
