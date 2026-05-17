import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-midnight text-xs font-bold text-white">
        P
      </span>
      {!compact && (
        <span className="font-dashboard-title text-lg font-bold tracking-tight text-foreground">
          Peer Academy
        </span>
      )}
    </div>
  );
}
