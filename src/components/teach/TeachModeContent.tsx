'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenSquare } from 'lucide-react';
import { FullCourseFromPromptPanel } from '@/components/instructor/FullCourseFromPromptPanel';

interface TeachModeContentProps {
  /** When true, stays on the dashboard after publish instead of navigating away. */
  embedded?: boolean;
  onCoursePublished?: () => void;
}

export function TeachModeContent({
  embedded = false,
  onCoursePublished,
}: TeachModeContentProps = {}) {
  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6 max-w-3xl'}>
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenSquare className="h-6 w-6" />
            Teach Mode
          </CardTitle>
          <CardDescription>
            Enter any topic or paste a full outline — AI builds modules, lessons, quizzes, projects, and a weekly plan.
          </CardDescription>
        </CardHeader>
      </Card>
      <FullCourseFromPromptPanel embedded={embedded} onCoursePublished={onCoursePublished} />
    </div>
  );
}
