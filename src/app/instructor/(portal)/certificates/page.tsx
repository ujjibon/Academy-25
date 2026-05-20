import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorCertificatesPanel } from '@/components/platform/instructor-panels';

export default function InstructorCertificatesPage() {
  return (
    <FeaturePageShell featureId="certificates">
      <InstructorCertificatesPanel />
    </FeaturePageShell>
  );
}
