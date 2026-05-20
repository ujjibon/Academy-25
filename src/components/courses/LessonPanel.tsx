'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Matches dashboard `stat-card-muted` — grey-blue surface, navy type, soft shadow. */
export function LessonPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-border bg-surface-muted text-foreground',
        'shadow-[0_2px_12px_rgb(0_11_88/0.04)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function LessonPanelHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function LessonPanelTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-dashboard-title text-lg font-bold tracking-tight text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function LessonPanelDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

export function LessonPanelContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function LessonPanelFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}
