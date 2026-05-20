'use client';

import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Users } from 'lucide-react';
import { LaptopMockup } from '@/components/marketing/laptop-mockup';

const stats = [
  { value: '50+', label: 'Interactive courses' },
  { value: 'AI', label: 'Personal coach' },
  { value: '24/7', label: 'Learning access' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/8 blur-3xl animate-aurora" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/6 blur-3xl animate-aurora-sweep" />
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--primary) / 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="container relative py-16 md:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left animate-fade-in-up">
            <span className="badge-royal mb-6 inline-flex">
              <span className="dot-flare" aria-hidden />
              AI-powered learning platform
            </span>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] text-balance">
              Unleash your potential with an{' '}
              <span className="serif-italic gradient-text">AI coach</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-balance lg:mx-0">
              Peer Academy is your personalized learning companion. Master skills faster
              with guided lessons, real dashboards, and smart feedback — all in one place.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/signup" className="brand-button gap-2">
                Start learning free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#demo" className="brand-button-ghost gap-2">
                <Play className="h-4 w-4" />
                See it in action
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="font-dashboard-title text-2xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Built for learners & instructors
              </span>
              <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent" />
                Powered by Gemini AI
              </span>
            </div>
          </div>

          <div className="animate-scale-in" style={{ animationDelay: '0.15s' }}>
            <LaptopMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
