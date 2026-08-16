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
  /** Optional top-right header action (e.g. Log in link) */
  headerAction?: ReactNode;
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  wide,
  headerAction,
}: AuthShellProps) {
  return (
    <div className="auth-mesh relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--border)/0.55)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--border)/0.55)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          {headerAction}
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:pb-16 sm:pt-4">
          <div
            className={cn(
              'w-full space-y-6 animate-fade-in-up',
              wide ? 'max-w-2xl' : 'max-w-[26rem]'
            )}
          >
            <div className="space-y-3 text-center">
              <span className="badge-royal mx-auto">
                <span className="dot-flare" aria-hidden />
                Peer Academy
              </span>
              <h1 className="font-heading text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground text-balance">
                {description}
              </p>
            </div>

            <div className="auth-panel p-5 sm:p-8">{children}</div>

            {footer ? <div className="animate-fade-in px-1">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
