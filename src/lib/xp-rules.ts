export const XP_RULES = {
  completeLesson: 20,
  completeQuiz: 30,
  submitProject: 50,
  completeCourse: 200,
  dailyLoginStreak: 10,
} as const;

export type XPAction = keyof typeof XP_RULES;

export function xpForAction(action: XPAction): number {
  return XP_RULES[action];
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}
