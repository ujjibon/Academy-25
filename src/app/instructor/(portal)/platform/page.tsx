import { PlatformFeaturesGrid } from '@/components/platform/PlatformFeaturesGrid';

export default function InstructorPlatformPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <span className="dashboard-kicker">Platform</span>
        <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Instructor tools
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Course building, assignments, drip scheduling, commerce, analytics, and every
          platform feature in one place.
        </p>
      </header>
      <PlatformFeaturesGrid role="instructor" />
    </div>
  );
}
