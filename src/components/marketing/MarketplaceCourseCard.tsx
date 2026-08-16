import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, type MarketplaceListing } from '@/lib/marketplace-data';
import { getCourseDetails, formatEnrollment } from '@/lib/course-details';
import { StarRating } from '@/components/courses/StarRating';

export function MarketplaceCourseCard({ listing }: { listing: MarketplaceListing }) {
  const catalogId = listing.id.startsWith('sample-')
    ? listing.id.replace(/^sample-/, '')
    : listing.id;
  const details = getCourseDetails(catalogId);

  return (
    <article className="brand-card hover-lift flex flex-col overflow-hidden p-0">
      <div className="aspect-video relative overflow-hidden">
        <Image src={listing.coverImage} alt={listing.title} fill className="object-cover" />
        <span className="absolute right-3 top-3 rounded-full bg-royal px-3 py-1 text-xs font-semibold text-white">
          {formatPrice(listing.priceCents)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <ShoppingBag className="h-3.5 w-3.5 text-royal" />
          <span>{listing.isLive ? 'Instructor listing' : 'Featured course'}</span>
        </div>
        <h3 className="font-heading text-lg font-semibold">{listing.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
          {listing.description}
        </p>
        {details ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StarRating rating={details.rating} size="sm" />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {formatEnrollment(details.enrolledCount)} enrolled
            </span>
          </div>
        ) : null}
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          {listing.instructorName}
        </p>
        {listing.classCode ? (
          <p className="mt-1 text-xs text-muted-foreground">Class code: {listing.classCode}</p>
        ) : null}
        <Button asChild className="w-full mt-5 brand-button">
          <Link
            href={
              listing.isLive
                ? listing.href
                : `/courses/${catalogId}`
            }
          >
            {listing.isLive ? 'Join classroom' : 'View course'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
