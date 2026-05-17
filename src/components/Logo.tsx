import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        P
      </span>
      <span className="font-dashboard-title text-lg font-bold tracking-tight text-foreground">
        Peer <span className="text-primary">Academy</span>
      </span>
    </div>
  );
}
