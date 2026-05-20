import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerAssignmentsPanel } from '@/components/platform/learner-panels';

export default function LearnAssignmentsPage() {
  return (
    <FeaturePageShell featureId="assignments">
      <LearnerAssignmentsPanel />
    </FeaturePageShell>
  );
}
