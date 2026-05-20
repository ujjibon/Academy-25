import Link from 'next/link';
import { ArrowRight, CreditCard, Shield, ShoppingBag } from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { MarketplaceCatalog } from '@/components/marketing/MarketplaceCatalog';
import { MARKETPLACE_STATS } from '@/lib/marketplace-data';
import { Logo } from '@/components/Logo';

export default function MarketplacePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/6 blur-3xl" />
          </div>
          <div className="container relative py-14 md:py-20">
            <span className="badge-royal mb-5 inline-flex gap-2">
              <ShoppingBag className="h-3.5 w-3.5" />
              eCommerce marketplace
            </span>
            <h1 className="font-heading max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
              Discover courses from{' '}
              <span className="serif-italic gradient-text">instructors worldwide</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              A dedicated store for one-time course purchases. Browse listings, compare prices,
              and join with your class code after checkout.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="brand-button gap-2">
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/learn/commerce" className="brand-button-ghost">
                My purchases
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-10 md:py-14">
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {MARKETPLACE_STATS.map((stat) => (
              <div key={stat.label} className="dashboard-panel p-6">
                <p className="font-dashboard-title text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Course listings</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Live instructor listings appear first; featured catalog courses fill the store
                when none are published yet.
              </p>
            </div>
            <Link
              href="/instructor/commerce"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Sell your course
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <MarketplaceCatalog />
        </section>

        <section className="container pb-16 md:pb-20">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="dashboard-panel flex gap-4 p-6">
              <CreditCard className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h3 className="font-heading font-semibold">PayPal checkout</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Secure payments for course access and platform subscriptions, built into Peer
                  Academy.
                </p>
              </div>
            </div>
            <div className="dashboard-panel flex gap-4 p-6">
              <Shield className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h3 className="font-heading font-semibold">Classroom access</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  After purchase, join with your instructor&apos;s class code from the{' '}
                  <Link href="/courses" className="text-primary hover:underline">
                    courses hub
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:flex-row md:py-8">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/marketplace" className="hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <Link href="/courses" className="hover:text-foreground transition-colors">
              Courses
            </Link>
          </nav>
          <p className="text-center text-sm text-muted-foreground md:text-right">
            © {new Date().getFullYear()} Peer Academy
          </p>
        </div>
      </footer>
    </div>
  );
}
