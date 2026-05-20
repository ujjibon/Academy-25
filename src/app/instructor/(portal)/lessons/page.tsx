import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorLessonsPanel } from '@/components/platform/instructor-panels';

export default function InstructorLessonsPage() {
  return (
    <FeaturePageShell featureId="lessons-quizzes">
      <InstructorLessonsPanel />
    </FeaturePageShell>
  );
}
