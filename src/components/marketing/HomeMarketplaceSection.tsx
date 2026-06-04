import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { MARKETPLACE_STATS } from '@/lib/marketplace-data';
import { MarketplaceCatalog } from '@/components/marketing/MarketplaceCatalog';

export function HomeMarketplaceSection() {
  return (
    <section
      id="marketplace"
      className="border-y border-border bg-muted/30 py-16 md:py-24 lg:py-28"
    >
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="dashboard-kicker mb-4 mx-auto flex gap-2">
            <ShoppingBag className="h-3.5 w-3.5" />
            Course marketplace
          </span>
          <h2 className="section-head mt-4">
            Buy and sell <span className="serif-italic gradient-text">courses</span>
          </h2>
          <p className="section-lead">
            Browse instructor listings, compare pricing, and join classrooms with a class code —
            all on a dedicated marketplace separate from your learning dashboard.
          </p>
        </div>

        <div className="mx-auto mb-10 grid max-w-3xl grid-cols-3 gap-2 sm:gap-4">
          {MARKETPLACE_STATS.map((stat) => (
            <div
              key={stat.label}
              className="dashboard-panel panel-padding text-center"
            >
              <p className="font-dashboard-title text-xl font-bold tracking-tight sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <MarketplaceCatalog limit={3} showBrowseHint={false} />

        <div className="mt-10 flex justify-center">
          <Link href="/marketplace" className="brand-button gap-2">
            Browse full marketplace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
