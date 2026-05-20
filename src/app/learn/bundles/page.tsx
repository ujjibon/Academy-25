import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerBundlesPanel } from '@/components/platform/learner-panels';

export default function LearnBundlesPage() {
  return (
    <FeaturePageShell featureId="course-bundles">
      <LearnerBundlesPanel />
    </FeaturePageShell>
  );
}
