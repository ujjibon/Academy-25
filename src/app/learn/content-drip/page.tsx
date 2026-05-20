import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerContentDripPanel } from '@/components/platform/learner-panels';

export default function LearnContentDripPage() {
  return (
    <FeaturePageShell featureId="content-drip">
      <LearnerContentDripPanel />
    </FeaturePageShell>
  );
}
