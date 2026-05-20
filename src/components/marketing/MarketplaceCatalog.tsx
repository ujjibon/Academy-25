'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getCoursesForSale } from '@/lib/classroom-service';
import {
  classroomToListing,
  getSampleMarketplaceListings,
  type MarketplaceListing,
} from '@/lib/marketplace-data';
import { MarketplaceCourseCard } from '@/components/marketing/MarketplaceCourseCard';
import { Skeleton } from '@/components/ui/skeleton';

type MarketplaceCatalogProps = {
  limit?: number;
  showBrowseHint?: boolean;
};

export function MarketplaceCatalog({ limit, showBrowseHint = true }: MarketplaceCatalogProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingSamples, setUsingSamples] = useState(false);

  useEffect(() => {
    getCoursesForSale()
      .then((courses) => {
        const live = courses.map(classroomToListing);
        if (live.length > 0) {
          setListings(live);
          setUsingSamples(false);
        } else {
          setListings(getSampleMarketplaceListings());
          setUsingSamples(true);
        }
      })
      .catch(() => {
        setListings(getSampleMarketplaceListings());
        setUsingSamples(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () => (limit ? listings.slice(0, limit) : listings),
    [listings, limit]
  );

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-72 rounded-[var(--radius)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {usingSamples && showBrowseHint ? (
        <p className="text-sm text-muted-foreground">
          Showing featured catalog courses. Instructors can list live classrooms for sale from{' '}
          <Link href="/instructor/commerce" className="text-primary hover:underline">
            eCommerce settings
          </Link>
          .
        </p>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((listing) => (
          <MarketplaceCourseCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
