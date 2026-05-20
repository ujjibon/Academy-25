import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorAnalyticsPanel } from '@/components/platform/instructor-panels';

export default function InstructorAnalyticsPage() {
  return (
    <FeaturePageShell featureId="analytics">
      <InstructorAnalyticsPanel />
    </FeaturePageShell>
  );
}
