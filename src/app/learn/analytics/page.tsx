import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerAnalyticsPanel } from '@/components/platform/learner-panels';

export default function LearnAnalyticsPage() {
  return (
    <FeaturePageShell featureId="analytics">
      <LearnerAnalyticsPanel />
    </FeaturePageShell>
  );
}
