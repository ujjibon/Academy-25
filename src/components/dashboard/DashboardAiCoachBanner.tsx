'use client';

import Link from 'next/link';
import { BrainCircuit, FileText } from 'lucide-react';
import { UserProfile } from '@/lib/firebase';

interface DashboardAiCoachBannerProps {
  userProfile: UserProfile;
}

export function DashboardAiCoachBanner({ userProfile }: DashboardAiCoachBannerProps) {
  const activeCourseId = userProfile.activeCourseId;

  return (
    <section className="cta-band-royal">
      <div className="space-y-2 max-w-2xl">
        <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
          <BrainCircuit className="h-4 w-4" />
          AI personal coach
        </div>
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl text-balance">
          Get a personalized learning plan with AI
        </h2>
        <p className="text-sm text-white/75 leading-relaxed">
          Your coach analyzes strengths, gaps, and active courses to suggest what to
          study next — tailored to your goals.
        </p>
      </div>
      <Link
        href={activeCourseId ? `/courses/${activeCourseId}` : '/courses'}
        className="cta-band-button"
      >
        <FileText className="h-4 w-4" />
        Open AI coach
      </Link>
    </section>
  );
}
