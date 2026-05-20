import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerSubscriptionsPanel } from '@/components/platform/learner-panels';

export default function LearnSubscriptionsPage() {
  return (
    <FeaturePageShell featureId="subscriptions">
      <LearnerSubscriptionsPanel />
    </FeaturePageShell>
  );
}
