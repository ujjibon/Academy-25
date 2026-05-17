'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  BrainCircuit,
  Award,
  BookOpenCheck,
  LayoutDashboard,
  Users,
  Languages,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LessonContent } from '@/components/courses/LessonContent';
import { getCourse } from '@/lib/data-provider';
import { SiteHeader } from '@/components/marketing/site-header';
import { Logo } from '@/components/Logo';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const sampleCourse = getCourse('react-fundamentals');
  const sampleLesson = sampleCourse?.lessons[0];

  const features = [
    {
      icon: BrainCircuit,
      title: 'AI Personal Coach',
      description:
        'Your AI guide suggests tasks, answers questions, and provides feedback to keep you on track.',
    },
    {
      icon: BookOpenCheck,
      title: 'Structured Learning',
      description:
        'Follow a clear path with video tutorials, text explanations, and practical projects.',
    },
    {
      icon: Award,
      title: 'Gamified Experience',
      description:
        'Earn XP, level up, and unlock badges. Compete with friends on the leaderboard.',
    },
    {
      icon: LayoutDashboard,
      title: 'Progress Dashboard',
      description:
        'Visualize your journey, track goals, and see your strengths and weaknesses at a glance.',
    },
    {
      icon: Users,
      title: 'Teach & Learn',
      description:
        'Solidify your knowledge by creating micro-courses for the community and earn rewards.',
    },
    {
      icon: Languages,
      title: 'Multilingual & Inclusive',
      description:
        'Learn in your preferred language with AI-powered translations and accessibility features.',
    },
  ];

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/8 blur-3xl animate-aurora" />
            <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/6 blur-3xl animate-aurora-sweep" />
          </div>

          <div className="container relative py-20 md:py-28 lg:py-32">
            <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
              <span className="badge-royal mb-6 inline-flex">
                <span className="dot-flare" aria-hidden />
                AI-powered learning
              </span>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Unleash your potential with an{' '}
                <span className="serif-italic">AI coach</span>.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
                Peer Academy is your personalized learning companion. Master new skills
                faster with AI-guided lessons, real-world projects, and smart feedback.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup" className="brand-button">
                  Start learning free
                </Link>
                <a href="#features" className="brand-button-ghost">
                  View features
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container py-20 md:py-28">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="dashboard-kicker mb-4 mx-auto flex">Platform</span>
            <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
              Everything you need to <span className="serif-italic">succeed</span>.
            </h2>
            <p className="mt-4 text-muted-foreground text-balance">
              Peer Academy combines cutting-edge AI with proven learning methods to create
              the ultimate educational experience.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <article
                key={feature.title}
                className="brand-card hover-lift flex flex-col p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Live demo */}
        <section className="border-y border-border/60 bg-background-elevated/40 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <span className="dashboard-kicker mb-4 mx-auto flex">Live demo</span>
              <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Try a <span className="serif-italic gradient-text">learning session</span>.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Experience interactive learning — answer a quiz, get instant feedback, and
                see how Peer Academy makes learning engaging.
              </p>
            </div>
            <div className="mx-auto max-w-2xl brand-card p-4 sm:p-6">
              {sampleCourse && sampleLesson ? (
                <LessonContent course={sampleCourse} lesson={sampleLesson} />
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Demo unavailable. Please check back later.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="container py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[var(--radius)] border border-border">
              <Image
                src="https://placehold.co/600x400.png"
                width={600}
                height={400}
                alt="Personalized learning path"
                className="w-full object-cover"
                data-ai-hint="learning path"
              />
            </div>
            <div className="space-y-6">
              <span className="dashboard-kicker inline-flex">Your journey</span>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
                Your unique <span className="serif-italic">skill journey</span>.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Start with a plan tailored to your goals and current skill level. Our AI
                adapts to your pace, ensuring you&apos;re always challenged but never
                overwhelmed.
              </p>
              <Link href="/signup" className="brand-button inline-flex">
                Discover your path
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="brand-section mx-4 mb-12 rounded-[var(--radius)] md:mx-auto md:max-w-5xl">
          <div className="container py-16 text-center md:py-20">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
              Ready to transform your learning?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Join learners using Peer Academy to master skills with AI-guided lessons and
              real-world projects.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-medium text-midnight transition hover:bg-white/90"
              >
                Get started free
              </Link>
              <Link href="/login" className="brand-button-ghost border-white/30 text-white hover:bg-white/10 hover:border-white">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:flex-row md:py-8">
          <Logo />
          <p className="text-center text-sm text-muted-foreground md:text-right">
            © {new Date().getFullYear()} Peer Academy. Crafted with care, worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
}
