import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorLiveClassesPanel } from '@/components/platform/instructor-panels';

export default function InstructorLiveClassesPage() {
  return (
    <FeaturePageShell featureId="live-classes">
      <InstructorLiveClassesPanel />
    </FeaturePageShell>
  );
}
