import type { ReactNode } from 'react';
import type { PlatformFeatureId } from '@/lib/platform-features';
import { getFeatureById } from '@/lib/platform-features';

type Props = {
  featureId: PlatformFeatureId;
  children: ReactNode;
  /** Render children without the inner panel wrapper (for wide dashboards). */
  unboxed?: boolean;
};

export function FeaturePageShell({ featureId, children, unboxed }: Props) {
  const feature = getFeatureById(featureId);
  if (!feature) return null;

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <span className="dashboard-kicker">Platform</span>
        <div className="mt-3 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <feature.icon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {feature.title}
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">{feature.description}</p>
          </div>
        </div>
      </header>
      {unboxed ? children : <div className="dashboard-panel p-6">{children}</div>}
    </div>
  );
}
