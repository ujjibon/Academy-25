import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';

interface InstructorAuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function InstructorAuthShell({
  title,
  description,
  children,
  footer,
}: InstructorAuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 brand-section opacity-[0.07]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden>
        <div className="absolute -left-20 top-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-12 bottom-8 h-72 w-72 rounded-full bg-royal/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            ← Peer Academy
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            Instructor
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-md space-y-6 animate-fade-in-up">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h1 className="font-dashboard-title text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="text-muted-foreground text-balance text-sm leading-relaxed">
                {description}
              </p>
            </div>

            <div className="dashboard-panel p-6 sm:p-8 border-primary/10">{children}</div>

            {footer ? (
              <div className="text-center text-sm text-muted-foreground">{footer}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
