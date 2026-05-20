import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorPrerequisitesPanel } from '@/components/platform/instructor-panels';

export default function InstructorPrerequisitesPage() {
  return (
    <FeaturePageShell featureId="prerequisites">
      <InstructorPrerequisitesPanel />
    </FeaturePageShell>
  );
}
