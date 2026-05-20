import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorAiStudioPanel } from '@/components/platform/instructor-panels';

export default function InstructorAiStudioPage() {
  return (
    <FeaturePageShell featureId="ai-studio">
      <InstructorAiStudioPanel />
    </FeaturePageShell>
  );
}
