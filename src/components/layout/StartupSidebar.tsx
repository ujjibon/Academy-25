'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/use-auth';
import { startupFooterNav, startupNavSections } from '@/lib/startup-nav-config';
import type { NavItem } from '@/lib/nav-config';
import { signOut as firebaseSignOut } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Settings,
  Languages,
  User,
  Shield,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function isItemActive(pathname: string, item: NavItem): boolean {
  if (!item.href) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavSections({ sections, pathname }: { sections: typeof startupNavSections; pathname: string }) {
  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label} className="px-2 py-0">
          <SidebarGroupLabel className="sidebar-section-label">{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isItemActive(pathname, item)}
                    className={cn(
                      'sidebar-nav-item h-10',
                      isItemActive(pathname, item) && 'sidebar-nav-item-active'
                    )}
                  >
                    <Link href={item.href!}>
                      <item.icon className="h-[1.05rem] w-[1.05rem]" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="badge-royal py-0 text-[0.65rem]">{item.badge}</span>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

export function StartupSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, isAdmin } = useAuth();

  const displayName = userProfile?.displayName || user?.displayName || 'User';
  const displayEmail = userProfile?.email || user?.email || '';
  const displayAvatar = userProfile?.photoURL || user?.photoURL || '';
  const displayLevel = userProfile?.level ?? 1;
  const displayXP = userProfile?.xp ?? 0;
  const streak = userProfile?.dailyStreak ?? 0;
  const xpToNext = 1000;
  const levelProgress = Math.min(100, Math.round((displayXP % xpToNext) / 10));

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
      toast({ title: 'Logged out', description: 'See you next time.' });
      router.push('/login');
    } catch {
      toast({ title: 'Error', description: 'Failed to log out.', variant: 'destructive' });
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border/70 px-4 py-5">
        <Link href="/startup" className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-3">
        <div className="px-3 mb-2">
          <div className="sidebar-signed-in">
            Founder
            <strong>{displayName}</strong>
          </div>
        </div>

        <div className="mx-3 mb-3 rounded-[calc(var(--radius)-6px)] border border-border bg-background-elevated/80 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-medium">Level {displayLevel}</span>
            <span>{displayXP.toLocaleString()} XP</span>
          </div>
          <div className="progress-brand mb-2">
            <div className="progress-brand-fill" style={{ width: `${levelProgress}%` }} />
          </div>
          {streak > 0 ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-flare">
              <Flame className="h-3.5 w-3.5" />
              {streak} day streak
            </div>
          ) : (
            <p className="text-[0.7rem] text-muted-foreground">Keep building your startup streak</p>
          )}
        </div>

        <NavSections sections={startupNavSections} pathname={pathname} />

        <SidebarSeparator className="mx-3 my-2" />

        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {startupFooterNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="sidebar-nav-item h-9 text-muted-foreground">
                    <Link href={item.href!}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
                  <p className="text-[0.7rem] text-muted-foreground truncate">{displayEmail}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="start" side="top">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <User className="mr-2 h-4 w-4" />
                Learner dashboard
              </Link>
            </DropdownMenuItem>
            {isAdmin ? (
              <DropdownMenuItem asChild>
                <Link href="/admin-portal">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  Admin portal
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Languages className="mr-2 h-4 w-4" />
              Language
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
