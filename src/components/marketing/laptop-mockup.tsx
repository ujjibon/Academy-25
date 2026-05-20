'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, School, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DashboardPreview,
  type PreviewView,
} from '@/components/marketing/dashboard-preview';

const views: { id: PreviewView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'classroom', label: 'Classroom', icon: School },
  { id: 'training', label: 'Training', icon: Zap },
];

interface LaptopMockupProps {
  autoRotate?: boolean;
  className?: string;
}

export function LaptopMockup({ autoRotate = true, className }: LaptopMockupProps) {
  const [activeView, setActiveView] = useState<PreviewView>('dashboard');

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setActiveView((current) => {
        const idx = views.findIndex((v) => v.id === current);
        return views[(idx + 1) % views.length].id;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [autoRotate]);

  return (
    <div className={cn('relative mx-auto w-full max-w-2xl', className)}>
      {/* Floating notification cards */}
      <div
        className="absolute -left-4 top-[18%] z-20 hidden animate-fade-in-up rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm sm:block lg:-left-8"
        style={{ animationDelay: '0.4s' }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Streak unlocked</p>
            <p className="text-[10px] text-muted-foreground">12 days · +50 XP</p>
          </div>
        </div>
      </div>

      <div
        className="absolute -right-2 bottom-[22%] z-20 hidden animate-fade-in-up rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm sm:block lg:-right-6"
        style={{ animationDelay: '0.55s' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          AI Coach
        </p>
        <p className="mt-0.5 max-w-[140px] text-xs text-foreground">
          &ldquo;Great job on Module 2 — ready for a quiz?&rdquo;
        </p>
      </div>

      {/* View switcher */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              activeView === view.id
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            <view.icon className="h-3.5 w-3.5" />
            {view.label}
          </button>
        ))}
      </div>

      {/* Laptop frame */}
      <div className="laptop-mockup-float relative">
        <div className="laptop-screen-gradient rounded-t-[1.25rem] p-[3px] sm:rounded-t-[1.5rem]">
          <div className="overflow-hidden rounded-t-[1.1rem] bg-background shadow-inner sm:rounded-t-[1.35rem]">
            <div className="aspect-[16/10] w-full min-h-[220px] sm:min-h-[280px]">
              <DashboardPreview view={activeView} className="h-full" />
            </div>
          </div>
        </div>
        <div className="laptop-base" aria-hidden />
        <div className="laptop-shadow" aria-hidden />
      </div>
    </div>
  );
}
