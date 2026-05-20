'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrainCircuit, Loader2, RefreshCw } from 'lucide-react';
import { generateDashboardSuggestion } from '@/ai/flows/generate-dashboard-suggestion';
import { useToast } from '@/hooks/use-toast';
import { getCourse } from '@/lib/data-provider';
import { UserProfile } from '@/lib/firebase';
import ReactMarkdown from 'react-markdown';

interface PersonalTrainerProps {
  userProfile: UserProfile;
}

export function PersonalTrainer({ userProfile }: PersonalTrainerProps) {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuggestion = async () => {
    setIsLoading(true);
    try {
      const activeCourse = getCourse(userProfile.activeCourseId || '');
      const result = await generateDashboardSuggestion({
        activeCourse: activeCourse?.title || 'None',
        strengths: userProfile.strengths.map((s) => s.name),
        weaknesses: userProfile.weaknesses.map((w) => w.name),
      });
      setSuggestion(result.suggestion);
    } catch {
      const fallbackSuggestions = [
        'Keep up the great work! Consistency is key to mastering new skills.',
        "You're making excellent progress! Review previous lessons to reinforce learning.",
        'Great job! Try to practice what you learned today.',
      ];
      setSuggestion(
        fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)]
      );
      toast({
        title: 'AI Service Unavailable',
        description: 'Using fallback suggestions until AI is configured.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.activeCourseId, userProfile.strengths, userProfile.weaknesses]);

  return (
    <section className="brand-card-flare p-6 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/85 text-sm font-medium">
            <BrainCircuit className="h-4 w-4" />
            Career roadmap
          </div>
          <h2 className="font-heading text-xl font-semibold text-white sm:text-2xl">
            Your AI coach insight
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchSuggestion}
          disabled={isLoading}
          className="cta-band-button shrink-0 self-start"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh tip
        </button>
      </div>

      <div className="mt-4 min-h-[4.5rem] rounded-xl border border-white/15 bg-white/10 p-4 text-sm leading-relaxed text-white">
        {isLoading ? (
          <div className="flex items-center gap-2 text-white/80">
            <Loader2 className="h-5 w-5 animate-spin" />
            Thinking of a suggestion…
          </div>
        ) : (
          <div className="coach-insight-markdown max-w-none [&_p]:my-1 [&_p]:text-white [&_strong]:font-semibold [&_strong]:text-white [&_em]:text-white/95 [&_a]:text-white [&_a]:underline">
            <ReactMarkdown>{suggestion}</ReactMarkdown>
          </div>
        )}
      </div>

      <Link
        href={userProfile.activeCourseId ? `/courses/${userProfile.activeCourseId}` : '/courses'}
        className="mt-4 inline-flex text-sm font-medium text-white underline-offset-4 hover:underline"
      >
        View learning path →
      </Link>
    </section>
  );
}


