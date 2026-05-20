import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Peer Academy"
      width={compact ? 120 : 160}
      height={compact ? 36 : 48}
      className={cn(
        'h-auto w-auto object-contain',
        compact ? 'max-h-8' : 'max-h-10',
        className
      )}
      priority
    />
  );
}
