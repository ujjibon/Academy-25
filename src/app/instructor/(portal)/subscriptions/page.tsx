import { FeaturePageShell } from '@/components/platform/FeaturePageShell';
import { SubscriptionManager } from '@/components/account/SubscriptionManager';

export default function InstructorSubscriptionsPage() {
  return (
    <FeaturePageShell featureId="subscriptions">
      <div className="max-w-3xl">
        <p className="text-sm text-muted-foreground mb-6">
          Manage your platform subscription. Learners use the same plans under Learning tools →
          Subscriptions.
        </p>
        <SubscriptionManager />
      </div>
    </FeaturePageShell>
  );
}
