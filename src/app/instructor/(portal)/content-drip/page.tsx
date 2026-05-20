import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorContentDripPanel } from '@/components/platform/instructor-panels';

export default function InstructorContentDripPage() {
  return (
    <FeaturePageShell featureId="content-drip">
      <InstructorContentDripPanel />
    </FeaturePageShell>
  );
}
