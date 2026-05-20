import AppLayout from '@/components/layout/AppLayout';
import { LearnAuthGuard } from '@/components/platform/LearnAuthGuard';

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <LearnAuthGuard>{children}</LearnAuthGuard>
    </AppLayout>
  );
}
