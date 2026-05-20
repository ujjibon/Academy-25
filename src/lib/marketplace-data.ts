import { courses as catalog } from '@/lib/courses';
import type { ClassroomCourse } from '@/lib/classroom-types';

export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  instructorName: string;
  priceCents: number;
  classCode?: string;
  isLive: boolean;
  href: string;
};

const SAMPLE_PRICES_CENTS = [1999, 2999, 3999, 4999];

export function formatPrice(priceCents: number): string {
  if (priceCents <= 0) return 'Free';
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function classroomToListing(course: ClassroomCourse): MarketplaceListing {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    coverImage: course.coverImage,
    instructorName: course.instructorName,
    priceCents: course.priceCents ?? 0,
    classCode: course.classCode,
    isLive: true,
    href: '/classroom',
  };
}

export function getSampleMarketplaceListings(): MarketplaceListing[] {
  return catalog.map((course, index) => ({
    id: `sample-${course.id}`,
    title: course.title,
    description: course.description,
    coverImage: course.image,
    instructorName: 'Peer Academy',
    priceCents: SAMPLE_PRICES_CENTS[index % SAMPLE_PRICES_CENTS.length],
    isLive: false,
    href: `/courses/${course.id}`,
  }));
}

export const MARKETPLACE_STATS = [
  { value: '50+', label: 'Courses available' },
  { value: 'From $19', label: 'One-time purchase' },
  { value: 'PayPal', label: 'Secure checkout' },
] as const;
