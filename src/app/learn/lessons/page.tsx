import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { LearnerLessonsPanel } from '@/components/platform/learner-panels';

export default function LearnLessonsPage() {
  return (
    <FeaturePageShell featureId="lessons-quizzes">
      <LearnerLessonsPanel />
    </FeaturePageShell>
  );
}
