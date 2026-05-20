import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerLiveClassesPanel } from '@/components/platform/learner-panels';

export default function LearnLiveClassesPage() {
  return (
    <FeaturePageShell featureId="live-classes">
      <LearnerLiveClassesPanel />
    </FeaturePageShell>
  );
}
