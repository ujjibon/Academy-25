import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorBundlesPanel } from '@/components/platform/instructor-panels';

export default function InstructorBundlesPage() {
  return (
    <FeaturePageShell featureId="course-bundles">
      <InstructorBundlesPanel />
    </FeaturePageShell>
  );
}
