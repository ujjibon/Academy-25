import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerCommercePanel } from '@/components/platform/learner-panels';

export default function LearnCommercePage() {
  return (
    <FeaturePageShell featureId="ecommerce">
      <LearnerCommercePanel />
    </FeaturePageShell>
  );
}
