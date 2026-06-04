'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo } from '@/components/Logo';

type NavLink = { href: string; label: string; isRoute?: boolean };

const navLinks: NavLink[] = [
  { href: '/#features', label: 'Features' },
  { href: '/marketplace', label: 'Marketplace', isRoute: true },
  { href: '/#demo', label: 'Demo' },
  { href: '/instructor/login', label: 'For instructors', isRoute: true },
  { href: '/login', label: 'Log in', isRoute: true },
];

export function MarketingMobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 shrink-0 rounded-full"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(100vw,20rem)] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo className="max-h-8 w-auto" aria-hidden />
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3.5 text-[0.9375rem] font-medium leading-none text-foreground transition-colors hover:bg-muted active:bg-muted"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3.5 text-[0.9375rem] font-medium leading-none text-foreground transition-colors hover:bg-muted active:bg-muted"
              >
                {link.label}
              </a>
            )
          )}
        </nav>
        <div className="safe-bottom mt-auto flex flex-col gap-2.5 border-t border-border p-4">
          <Link href="/signup" className="brand-button w-full justify-center text-[0.9375rem]">
            Get started
          </Link>
          <Link href="/login" className="brand-button-ghost w-full justify-center text-[0.9375rem]">
            Log in
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
