'use client';

import Link from 'next/link';
import { PLATFORM_FEATURES } from '@/lib/platform-features';
import { cn } from '@/lib/utils';

type Props = {
  role: 'instructor' | 'learner';
  className?: string;
};

export function PlatformFeaturesGrid({ role, className }: Props) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {PLATFORM_FEATURES.map((feature) => {
        const href = role === 'instructor' ? feature.instructorHref : feature.learnerHref;
        return (
          <Link
            key={feature.id}
            href={href}
            className="group flex flex-col rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </span>
              {feature.highlight ? (
                <span className="badge-royal text-[0.65rem]">{feature.highlight}</span>
              ) : null}
            </div>
            <h3 className="font-heading text-sm font-semibold">{feature.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {feature.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
