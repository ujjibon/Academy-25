'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getInstructorPageTitle } from '@/lib/instructor-nav-config';
import { useAuth } from '@/hooks/use-auth';
import { GraduationCap } from 'lucide-react';

export function InstructorHeader() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const title = getInstructorPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 glass px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
          Instructor Portal
        </p>
        <h1 className="font-dashboard-title truncate text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </h1>
      </div>
      {userProfile && (
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <GraduationCap className="h-4 w-4 text-primary" />
          {userProfile.displayName}
        </div>
      )}
    </header>
  );
}
