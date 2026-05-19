import Link from 'next/link';
import { Logo } from '@/components/Logo';

interface SiteHeaderProps {
  showAuth?: boolean;
}

export function SiteHeader({ showAuth = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        {showAuth && (
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/instructor/login" className="brand-button-ghost hidden md:inline-flex text-sm">
              For instructors
            </Link>
            <Link href="/login" className="brand-button-ghost hidden sm:inline-flex">
              Log in
            </Link>
            <Link href="/signup" className="brand-button">
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
