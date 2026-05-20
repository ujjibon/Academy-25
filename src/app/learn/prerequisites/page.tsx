import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerPrerequisitesPanel } from '@/components/platform/learner-panels';

export default function LearnPrerequisitesPage() {
  return (
    <FeaturePageShell featureId="prerequisites">
      <LearnerPrerequisitesPanel />
    </FeaturePageShell>
  );
}
