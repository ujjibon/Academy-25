import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, type MarketplaceListing } from '@/lib/marketplace-data';

export function MarketplaceCourseCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <article className="brand-card hover-lift flex flex-col overflow-hidden p-0">
      <div className="aspect-video relative overflow-hidden">
        <Image src={listing.coverImage} alt={listing.title} fill className="object-cover" />
        <span className="absolute right-3 top-3 rounded-full bg-midnight/90 px-3 py-1 text-xs font-semibold text-white">
          {formatPrice(listing.priceCents)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
          <span>{listing.isLive ? 'Instructor listing' : 'Featured course'}</span>
        </div>
        <h3 className="font-heading text-lg font-semibold">{listing.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
          {listing.description}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          {listing.instructorName}
        </p>
        {listing.classCode ? (
          <p className="mt-1 text-xs text-muted-foreground">Class code: {listing.classCode}</p>
        ) : null}
        <Button asChild className="w-full mt-5 brand-button">
          <Link href={listing.href}>
            {listing.isLive ? 'Join classroom' : 'View course'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
