import Link from 'next/link';
import { PlatformFeaturesGrid } from '@/components/platform/PlatformFeaturesGrid';

export default function LearnHubPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <span className="dashboard-kicker">Learning tools</span>
        <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Your learning platform
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Assignments, live classes, gradebook, bundles, certificates, and more — everything
          you need as a learner in one place.
        </p>
      </header>
      <PlatformFeaturesGrid role="learner" />
      <p className="text-sm text-muted-foreground">
        Need a subscription or billing?{' '}
        <Link href="/account?tab=subscription" className="text-primary hover:underline">
          Manage account
        </Link>
      </p>
    </div>
  );
}
