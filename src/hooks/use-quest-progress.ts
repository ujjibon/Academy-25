'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { completeQuest, readQuestProgress, QUEST_PROGRESS_EVENT, type QuestProgress } from '@/lib/quest-progress';

export function useQuestProgress(courseId: string, lessonId: string) {
  const { user } = useAuth();
  const accountId = user?.uid || 'guest';
  const [progress, setProgress] = useState<QuestProgress>({ completed: [], gameScores: {}, xp: 0 });
  const refresh = useCallback(() => setProgress(readQuestProgress(accountId, courseId, lessonId)), [accountId, courseId, lessonId]);
  useEffect(() => {
    refresh();
    window.addEventListener(QUEST_PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(QUEST_PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  const complete = useCallback((questId: string, xp: number) => completeQuest(accountId, courseId, lessonId, questId, xp), [accountId, courseId, lessonId]);
  return { progress, complete, accountId };
}
