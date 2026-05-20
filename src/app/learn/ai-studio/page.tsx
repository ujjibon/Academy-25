import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerAiStudioPanel } from '@/components/platform/learner-panels';

export default function LearnAiStudioPage() {
  return (
    <FeaturePageShell featureId="ai-studio">
      <LearnerAiStudioPanel />
    </FeaturePageShell>
  );
}
