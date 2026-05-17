'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { getPageTitle } from '@/lib/nav-config';
import { useChatbot } from '@/hooks/use-chatbot';
import { useAuth } from '@/hooks/use-auth';
import {
  Bot,
  Bell,
  Search,
  Wifi,
  WifiOff,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
  const pathname = usePathname();
  const { open: openChat } = useChatbot();
  const { connectionError, userProfile } = useAuth();

  const title = getPageTitle(pathname);
  const breadcrumbParent =
    pathname.startsWith('/courses/') && pathname !== '/courses'
      ? { label: 'Courses', href: '/courses' }
      : pathname.startsWith('/admin-portal/') && pathname !== '/admin-portal'
        ? { label: 'Admin', href: '/admin-portal' }
        : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 glass px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

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
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Peer Academy
          </p>
        )}
        <h1 className="font-dashboard-title truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex rounded-full h-9 w-9"
          asChild
        >
          <Link href="/courses" aria-label="Search courses">
            <Search className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 relative"
          aria-label="Notifications"
          disabled
        >
          <Bell className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:inline-flex gap-2 rounded-full"
          onClick={openChat}
        >
          <Bot className="h-4 w-4" />
          AI Assistant
        </Button>

        {userProfile?.activeCourseId ? (
          <Button asChild size="sm" className="hidden md:inline-flex brand-button gap-1.5 !py-2 !px-4 text-sm">
            <Link href={`/courses/${userProfile.activeCourseId}`}>
              <Zap className="h-3.5 w-3.5" />
              Continue
            </Link>
          </Button>
        ) : null}

        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
            connectionError
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border bg-background-elevated/80 text-muted-foreground'
          )}
        >
          {connectionError ? (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

