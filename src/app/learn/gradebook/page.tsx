import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerGradebookPanel } from '@/components/platform/learner-panels';

export default function LearnGradebookPage() {
  return (
    <FeaturePageShell featureId="gradebook">
      <LearnerGradebookPanel />
    </FeaturePageShell>
  );
}
