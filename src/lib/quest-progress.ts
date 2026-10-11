'use client';

export type QuestProgress = {
  completed: string[];
  gameScores: Record<string, number>;
  xp: number;
};

export const QUEST_PROGRESS_EVENT = 'academy-quest-progress';
const empty = (): QuestProgress => ({ completed: [], gameScores: {}, xp: 0 });
const storageKey = (accountId: string, courseId: string, lessonId: string) =>
  `academy:expedition:v1:${encodeURIComponent(accountId)}:${encodeURIComponent(courseId)}:${encodeURIComponent(lessonId)}`;

// Expedition rewards are practice evidence on this device. They do not award
// certificates or modify the account's cloud XP balance.
export function readQuestProgress(accountId: string, courseId: string, lessonId: string): QuestProgress {
  if (typeof window === 'undefined') return empty();
  try {
    const data = JSON.parse(localStorage.getItem(storageKey(accountId, courseId, lessonId)) || 'null');
    if (!data || !Array.isArray(data.completed) || typeof data.gameScores !== 'object') return empty();
    return {
      completed: data.completed.filter((id: unknown) => typeof id === 'string'),
      gameScores: Object.fromEntries(Object.entries(data.gameScores || {}).filter(([, score]) => typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100)) as Record<string, number>,
      xp: Number.isFinite(data.xp) ? Math.max(0, Math.min(100000, data.xp)) : 0,
    };
  } catch { return empty(); }
}

function save(accountId: string, courseId: string, lessonId: string, progress: QuestProgress) {
  try {
    localStorage.setItem(storageKey(accountId, courseId, lessonId), JSON.stringify(progress));
    window.dispatchEvent(new Event(QUEST_PROGRESS_EVENT));
    return true;
  } catch { return false; }
}

export function completeQuest(accountId: string, courseId: string, lessonId: string, questId: string, xp: number): boolean {
  const progress = readQuestProgress(accountId, courseId, lessonId);
  if (progress.completed.includes(questId)) return false;
  return save(accountId, courseId, lessonId, {
    ...progress,
    completed: [...progress.completed, questId],
    xp: progress.xp + Math.max(0, Math.min(100, Math.round(xp))),
  });
}

export function recordGameCompletion(accountId: string, courseId: string, lessonId: string, gameKey: string, score: number, xp: number): boolean {
  if (!Number.isFinite(score) || score < 0 || score > 100) return false;
  const progress = readQuestProgress(accountId, courseId, lessonId);
  const wasMastered = (progress.gameScores[gameKey] || 0) >= 70;
  const mastered = score >= 70;
  const saved = save(accountId, courseId, lessonId, {
    completed: mastered && !progress.completed.includes('play') ? [...progress.completed, 'play'] : progress.completed,
    gameScores: { ...progress.gameScores, [gameKey]: Math.max(progress.gameScores[gameKey] || 0, score) },
    xp: progress.xp + (mastered && !wasMastered ? Math.max(0, Math.min(80, Math.round(xp))) : 0),
  });
  return saved && mastered && !wasMastered;
}
