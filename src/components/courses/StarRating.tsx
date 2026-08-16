import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({
  rating,
  size = 'md',
  showValue = true,
  className,
}: {
  rating: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}) {
  const starClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => {
          const filled = rating >= i + 1;
          const half = !filled && rating >= i + 0.5;
          return (
            <Star
              key={i}
              className={cn(
                starClass,
                // Brand royal (logo blue) — never amber/yellow
                filled || half
                  ? 'fill-primary text-primary'
                  : 'text-slate/50'
              )}
            />
          );
        })}
      </div>
      {showValue ? (
        <span
          className={cn(
            'font-semibold tabular-nums text-midnight',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {rating.toFixed(1)}
        </span>
      ) : null}
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
    </div>
  );
}
