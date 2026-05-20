'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FilePlus2,
  LogOut,
  Loader2,
  ExternalLink,
  Sparkles,
  GraduationCap,
  ChevronRight,
  Rocket,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signOut as firebaseSignOut } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ChatbotProvider } from '@/hooks/use-chatbot';
import { Chatbot } from '@/components/chat/Chatbot';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isUnauthorizedPage = pathname === '/admin-portal/unauthorized';

  useEffect(() => {
    if (isUnauthorizedPage) return;
    if (!loading && !user) {
      router.replace('/admin/login');
    } else if (!loading && user && userProfile && !isAdmin) {
      router.replace('/admin-portal/unauthorized');
    }
  }, [user, userProfile, loading, isAdmin, router, isUnauthorizedPage]);

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
      toast({ title: 'Logged Out', description: 'Admin session ended.' });
      router.push('/admin/login');
    } catch {
      toast({ title: 'Error', description: 'Failed to log out.', variant: 'destructive' });
    }
  };

  const navItems = [
    { href: '/admin-portal', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin-portal/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin-portal/users', label: 'Users', icon: Users },
    { href: '/admin-portal/notifications', label: 'Notifications', icon: Mail },
    { href: '/admin-portal/startup', label: 'Startup program', icon: Rocket },
    { href: '/admin-portal/course-creator', label: 'AI Course Creator', icon: Sparkles },
    { href: '/admin-portal/bootcamp-studio', label: 'Bootcamp Studio', icon: GraduationCap },
    { href: '/admin-portal/manual-editor', label: 'Manual Editor', icon: FilePlus2 },
  ];

  if (isUnauthorizedPage) {
    return <>{children}</>;
  }

  if (loading || !user || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = userProfile.displayName || user.displayName || 'Admin';
  const displayEmail = userProfile.email || user.email || '';

  return (
    <ChatbotProvider>
      <SidebarProvider className="dashboard-shell min-h-svh">
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
          <SidebarHeader className="border-b border-sidebar-border/70 px-4 py-5">
            <Link href="/admin-portal" className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg block">
              <Logo />
              <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wide uppercase">
                Admin portal
              </p>
            </Link>
          </SidebarHeader>

          <SidebarContent className="gap-1 py-3">
            <SidebarGroup className="px-2 py-0">
              <SidebarGroupLabel className="sidebar-section-label">Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            'sidebar-nav-item h-10',
                            isActive && 'sidebar-nav-item-active'
                          )}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-[1.05rem] w-[1.05rem]" />
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/70 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-auto justify-between gap-2 rounded-xl px-2 py-2.5 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={userProfile.photoURL} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate text-left group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
                      <p className="text-[0.7rem] text-muted-foreground truncate">Administrator</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="start" side="top">
                <DropdownMenuLabel>{displayEmail}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span>Learner dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col min-h-svh">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
          <Chatbot />
        </SidebarInset>
      </SidebarProvider>
    </ChatbotProvider>
  );
}
