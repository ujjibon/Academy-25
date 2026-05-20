import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { InstructorCommercePanel } from '@/components/platform/instructor-panels';

export default function InstructorCommercePage() {
  return (
    <FeaturePageShell featureId="ecommerce" unboxed>
      <InstructorCommercePanel />
    </FeaturePageShell>
  );
}
