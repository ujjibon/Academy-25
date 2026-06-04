import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCourse } from '@/lib/data-provider';
import { SiteHeader } from '@/components/marketing/site-header';
import { HeroSection } from '@/components/marketing/hero-section';
import { FeaturesSection } from '@/components/marketing/features-section';
import { HomeAuthRedirect } from '@/components/marketing/HomeAuthRedirect';
import { HomeLessonDemo } from '@/components/marketing/HomeLessonDemo';
import { HomeMarketplaceSection } from '@/components/marketing/HomeMarketplaceSection';
import { Logo } from '@/components/Logo';

export default function Home() {
  const sampleCourse = getCourse('react-fundamentals');
  const sampleLesson = sampleCourse?.lessons[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HomeAuthRedirect />
      <SiteHeader />

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HomeMarketplaceSection />

        <section
          id="demo"
          className="home-demo-section border-y border-border py-16 md:py-24 lg:py-28"
        >
          <div className="container">
            <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
              <span className="dashboard-kicker mb-4 mx-auto flex">Live demo</span>
              <h2 className="section-head mt-4">
                Try a <span className="serif-italic gradient-text">learning session</span>.
              </h2>
              <p className="section-lead">
                Experience interactive learning — answer a quiz, get instant feedback, and
                see how Peer Academy makes learning engaging.
              </p>
            </div>
            <div className="home-lesson-demo mx-auto max-w-6xl p-3 sm:p-5 md:p-6">
              {sampleCourse && sampleLesson ? (
                <HomeLessonDemo course={sampleCourse} lesson={sampleLesson} />
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Demo unavailable. Please check back later.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="container py-20 md:py-28">
          <div className="cta-band-royal">
            <div className="max-w-lg space-y-3">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Your journey
              </span>
              <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl text-balance">
                Your unique <span className="serif-italic opacity-90">skill journey</span>{' '}
                starts here.
              </h2>
              <p className="text-[0.9375rem] text-white/80 leading-relaxed sm:text-sm">
                Start with a plan tailored to your goals. Our AI adapts to your pace so
                you&apos;re always challenged but never overwhelmed.
              </p>
            </div>
            <Link href="/signup" className="cta-band-button gap-2">
              Discover your path
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="brand-section mx-3 mb-10 rounded-[calc(var(--radius)-8px)] sm:mx-4 sm:mb-12 md:mx-auto md:max-w-5xl md:rounded-[var(--radius)]">
          <div className="px-5 py-12 text-center sm:container sm:py-16 md:py-20">
            <h2 className="section-head text-white">
              Ready to transform your learning?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/80 sm:text-base">
              Join learners using Peer Academy to master skills with AI-guided lessons and
              real-world projects.
            </p>
            <div className="mobile-actions mx-auto mt-8 max-w-sm justify-center sm:max-w-none">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-medium text-midnight transition hover:bg-white/90"
              >
                Get started free
              </Link>
              <Link href="/login" className="brand-button-ghost">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border safe-bottom">
        <div className="container flex flex-col items-center justify-between gap-6 py-10 text-center md:flex-row md:gap-4 md:py-8 md:text-left">
          <Logo className="mx-auto max-h-8 w-auto md:mx-0 md:max-h-10" />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.875rem] text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#marketplace" className="hover:text-foreground transition-colors">
              Marketplace
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Demo
            </a>
            <Link href="/marketplace" className="hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <Link href="/courses" className="hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Log in
            </Link>
          </nav>
          <p className="text-center text-sm text-muted-foreground md:text-right">
            © {new Date().getFullYear()} Peer Academy. Crafted with care, worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
}
