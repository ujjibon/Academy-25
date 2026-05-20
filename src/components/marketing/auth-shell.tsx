import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider card for sign-up path picker + forms */
  wide?: boolean;
}

export function AuthShell({ title, description, children, footer, wide }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="container flex h-16 items-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div
            className={cn(
              'w-full space-y-6 animate-fade-in-up',
              wide ? 'max-w-3xl' : 'max-w-md'
            )}
          >
            <div className="text-center space-y-2">
              <span className="badge-royal mx-auto">
                <span className="dot-flare" aria-hidden />
                Peer Academy
              </span>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="text-muted-foreground text-balance">{description}</p>
            </div>

            <div className="brand-card p-6 sm:p-8">{children}</div>

            {footer ? (
              <div className="text-center text-sm text-muted-foreground">{footer}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
