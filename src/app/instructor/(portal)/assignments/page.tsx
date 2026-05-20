import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorAssignmentsPanel } from '@/components/platform/instructor-panels';

export default function InstructorAssignmentsPage() {
  return (
    <FeaturePageShell featureId="assignments">
      <InstructorAssignmentsPanel />
    </FeaturePageShell>
  );
}
