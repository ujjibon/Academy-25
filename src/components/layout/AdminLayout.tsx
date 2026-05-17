'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
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
  Shield,
  FilePlus2,
  LogOut,
  Loader2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signOut as firebaseSignOut } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isUnauthorizedPage = pathname === '/admin-portal/unauthorized';

  useEffect(() => {
    if (isUnauthorizedPage) return;
    if (!loading && !user) {
      router.replace('/login?redirect=/admin-portal');
    } else if (!loading && user && userProfile && !isAdmin) {
      router.replace('/admin-portal/unauthorized');
    }
  }, [user, userProfile, loading, isAdmin, router, isUnauthorizedPage]);

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
      toast({ title: 'Logged Out', description: 'Admin session ended.' });
      router.push('/login');
    } catch {
      toast({ title: 'Error', description: 'Failed to log out.', variant: 'destructive' });
    }
  };

  const navItems = [
    { href: '/admin-portal', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin-portal/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin-portal/users', label: 'Users', icon: Users },
    { href: '/admin-portal/course-creator', label: 'AI Course Creator', icon: Sparkles },
    { href: '/admin-portal/manual-editor', label: 'Manual Editor', icon: FilePlus2 },
  ];

  if (isUnauthorizedPage) {
    return <>{children}</>;
  }

  if (loading || !user || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    );
  }

  const displayName = userProfile.displayName || user.displayName || 'Admin';
  const displayEmail = userProfile.email || user.email || '';

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-amber-500/10">
        <SidebarHeader className="border-b border-amber-500/10">
          <div className="flex items-center gap-2 px-2 py-1">
            <Shield className="h-6 w-6 text-amber-500 shrink-0" />
            <div>
              <span className="text-lg font-bold leading-tight">Admin Portal</span>
              <p className="text-[10px] text-muted-foreground">Peer Academy</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-left h-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile.photoURL} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="truncate group-data-[collapsible=icon]:hidden">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-amber-600 font-medium">Administrator</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
              <DropdownMenuLabel>{displayEmail}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Learner Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur sticky top-0 z-40">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">Administration</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
