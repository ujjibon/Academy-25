'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getStartupPageTitle } from '@/lib/startup-nav-config';
import { useAuth } from '@/hooks/use-auth';
import { Rocket, ChevronRight } from 'lucide-react';

export function StartupHeader() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const title = getStartupPageTitle(pathname);

  const breadcrumbParent =
    pathname.startsWith('/startup/') && pathname !== '/startup'
      ? { label: 'Startup', href: '/startup' }
      : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 glass px-3 safe-top sm:gap-3 sm:px-4 md:px-6">
      <SidebarTrigger className="touch-target shrink-0 md:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {breadcrumbParent ? (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href={breadcrumbParent.href} className="hover:text-foreground transition-colors">
              {breadcrumbParent.label}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{title}</span>
          </nav>
        ) : (
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
            Startup hub
          </p>
        )}
        <h1 className="font-dashboard-title truncate text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </h1>
      </div>
      {userProfile ? (
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <Rocket className="h-4 w-4 text-primary" />
          <span className="truncate max-w-[10rem]">{userProfile.displayName}</span>
        </div>
      ) : null}
    </header>
  );
}
