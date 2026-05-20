import Link from 'next/link';
import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { Button } from '@/components/ui/button';

export default function LearnCoursesPage() {
  return (
    <FeaturePageShell featureId="course-builder">
      <p className="text-sm text-muted-foreground mb-4">
        Browse and enroll in courses from the catalog, or join a live classroom with a class
        code.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="brand-button">
          <Link href="/courses">Open course catalog</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/classroom">Classroom hub</Link>
        </Button>
      </div>
    </FeaturePageShell>
  );
}
