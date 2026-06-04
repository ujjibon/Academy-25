import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { MarketingMobileNav } from '@/components/marketing/marketing-mobile-nav';

interface SiteHeaderProps {
  showAuth?: boolean;
}

export function SiteHeader({ showAuth = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass safe-top">
      <div className="container flex h-14 min-h-14 items-center justify-between gap-3 sm:h-16">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo className="max-h-8 w-auto sm:max-h-10" />
        </Link>
        {showAuth ? (
          <>
            <nav className="hidden items-center gap-2 md:flex md:gap-3">
              <a
                href="#features"
                className="brand-button-ghost hidden text-sm lg:inline-flex"
              >
                Features
              </a>
              <Link href="/marketplace" className="brand-button-ghost text-sm">
                Marketplace
              </Link>
              <a href="#demo" className="brand-button-ghost text-sm">
                Demo
              </a>
              <Link href="/instructor/login" className="brand-button-ghost hidden text-sm lg:inline-flex">
                For instructors
              </Link>
              <Link href="/login" className="brand-button-ghost hidden text-sm sm:inline-flex">
                Log in
              </Link>
              <Link href="/signup" className="brand-button text-sm">
                Get started
              </Link>
            </nav>
            <MarketingMobileNav />
          </>
        ) : null}
      </div>
    </header>
  );
}
