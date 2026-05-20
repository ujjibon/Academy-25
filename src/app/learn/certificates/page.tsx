import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerCertificatesPanel } from '@/components/platform/learner-panels';

export default function LearnCertificatesPage() {
  return (
    <FeaturePageShell featureId="certificates">
      <LearnerCertificatesPanel />
    </FeaturePageShell>
  );
}
