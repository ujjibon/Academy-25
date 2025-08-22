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
  User,
  Trophy,
  PenSquare,
  Settings,
  LogOut,
  Languages,
  Loader2,
  Shield,
  FilePlus2,
  Database,
} from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '@/hooks/use-auth';
import { signOut as firebaseSignOut } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Chatbot } from '../chat/Chatbot';
import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile, loading, isFirebaseMode, connectionError } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If no Firebase user, redirect to login
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      // Firebase logout
      await firebaseSignOut();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to log out.', variant: 'destructive' });
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/teach', label: 'Teach Mode', icon: PenSquare },
  ];
  
  const adminNavItems = [
    { href: '/admin/course-creator', label: 'AI Course Creator', icon: Shield },
    { href: '/admin/manual-editor', label: 'Manual Editor', icon: FilePlus2 },
  ]

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Get display info from Firebase user profile
  const displayName = userProfile?.displayName || user?.displayName || 'User';
  const displayEmail = userProfile?.email || user?.email || '';
  const displayAvatar = userProfile?.photoURL || user?.photoURL || '';
  const displayLevel = userProfile?.level || 1;
  const displayXP = userProfile?.xp || 0;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarMenu>
             <p className="text-xs text-muted-foreground px-4 py-2 font-medium">Admin</p>
             {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-left h-auto">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="truncate group-data-[collapsible=icon]:hidden">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                  <p className="text-xs text-primary font-medium">
                    Level {displayLevel} • {displayXP.toLocaleString()} XP
                  </p>
                </div>
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                 <Languages className="mr-2 h-4 w-4" />
                 <span>Language</span>
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
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
           <SidebarTrigger className="md:hidden" />
           <div className="flex-1">
             {/* Can add breadcrumbs or page title here */}
           </div>
           {/* Connection status indicator */}
           <div className="flex items-center gap-2">
             {connectionError ? (
               <div className="flex items-center gap-2 text-orange-600">
                 <WifiOff className="h-4 w-4" />
                 <span className="text-sm font-medium hidden md:inline">Offline</span>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-green-600">
                 <Wifi className="h-4 w-4" />
                 <span className="text-sm font-medium hidden md:inline">Online</span>
               </div>
             )}
           </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        <Chatbot />
      </SidebarInset>
    </SidebarProvider>
  );
}
