'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/firebase';
import { courses as catalog } from '@/lib/courses';
import { getCourse, type Course, type Lesson } from '@/lib/data-provider';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ── Types ──────────────────────────────────────────────────────────────

export type LessonNote = {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  body: string;
  updatedAt: Date;
  createdAt: Date;
};

export type StudyCard = {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  front: string;
  back: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt?: Date;
  createdAt: Date;
};

export type DailyMission = {
  id: string;
  title: string;
  description: string;
  href: string;
  xpReward: number;
  kind: 'continue' | 'review' | 'explore' | 'quiz' | 'streak';
  done: boolean;
};

export type PathStepStatus = 'done' | 'current' | 'locked' | 'recommended';

export type AdaptivePathStep = {
  id: string;
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  reason: string;
  estimatedMinutes: number;
  status: PathStepStatus;
  href: string;
  progressPercent: number;
};

export type AdaptiveLearningPath = {
  headline: string;
  focusAreas: string[];
  nextAction: AdaptivePathStep | null;
  steps: AdaptivePathStep[];
  completionRate: number;
  estimatedMinutesToday: number;
};

export type SearchHit = {
  type: 'course' | 'lesson';
  courseId: string;
  lessonId?: string;
  title: string;
  subtitle: string;
  href: string;
  progress?: number;
};

export type VerifiableCertificate = {
  id: string;
  code: string;
  userId: string;
  type: 'course' | 'training';
  title: string;
  skillOrCourseId: string;
  recipientName: string;
  issuedAt: string;
  completionSummary?: string;
};

export type LearningPulse = {
  dueReviews: number;
  notesCount: number;
  missions: DailyMission[];
  path: AdaptiveLearningPath;
  continueHref: string | null;
  continueLabel: string | null;
};

// ── SM-2 lite spaced repetition ────────────────────────────────────────

export function scheduleReview(
  card: Pick<StudyCard, 'ease' | 'intervalDays' | 'repetitions'>,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): Pick<StudyCard, 'ease' | 'intervalDays' | 'repetitions' | 'nextReviewAt' | 'lastReviewedAt'> {
  let { ease, intervalDays, repetitions } = card;
  const now = new Date();

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 3;
    else intervalDays = Math.max(1, Math.round(intervalDays * ease));
    repetitions += 1;
  }

  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return {
    ease,
    intervalDays,
    repetitions,
    nextReviewAt: addDays(now, intervalDays),
    lastReviewedAt: now,
  };
}

// ── Adaptive path ──────────────────────────────────────────────────────

function skillMatchScore(courseTitle: string, skills: { name: string; value: number }[]) {
  const hay = courseTitle.toLowerCase();
  let score = 0;
  for (const s of skills) {
    const needle = s.name.toLowerCase();
    if (hay.includes(needle) || needle.split(' ').some((w) => w.length > 2 && hay.includes(w))) {
      score += 100 - s.value;
    }
  }
  return score;
}

export function buildAdaptiveLearningPath(profile: UserProfile): AdaptiveLearningPath {
  const progress = profile.courseProgress || {};
  const completed = new Set(profile.completedCourses || []);
  const weaknesses = profile.weaknesses || [];
  const strengths = profile.strengths || [];

  const catalogIds = catalog.map((c) => c.id);
  const ranked = [...catalogIds]
    .map((courseId) => {
      const course = getCourse(courseId);
      const info = catalog.find((c) => c.id === courseId);
      if (!course || !info) return null;
      const pct = progress[courseId] ?? 0;
      const weakBoost = skillMatchScore(info.title, weaknesses) * 2;
      const strengthBoost = skillMatchScore(info.title, strengths) * 0.3;
      const inProgressBoost = pct > 0 && pct < 100 ? 120 : 0;
      const completedPenalty = completed.has(courseId) || pct >= 100 ? -200 : 0;
      const activeBoost = profile.activeCourseId === courseId ? 80 : 0;
      return {
        course,
        info,
        pct,
        score: weakBoost + strengthBoost + inProgressBoost + completedPenalty + activeBoost,
      };
    })
    .filter(Boolean) as {
    course: Course;
    info: (typeof catalog)[number];
    pct: number;
    score: number;
  }[];

  ranked.sort((a, b) => b.score - a.score);

  const steps: AdaptivePathStep[] = [];
  let foundCurrent = false;

  for (const item of ranked.slice(0, 8)) {
    const { course, info, pct } = item;
    const lessonIndex =
      pct >= 100
        ? course.lessons.length - 1
        : Math.min(
            course.lessons.length - 1,
            Math.max(0, Math.floor((pct / 100) * course.lessons.length))
          );
    const preferred =
      profile.activeCourseId === course.id && profile.activeLessonId
        ? course.lessons.find((l) => l.id === profile.activeLessonId)
        : null;
    const lesson = preferred || course.lessons[lessonIndex] || course.lessons[0];
    if (!lesson) continue;

    let status: PathStepStatus = 'recommended';
    if (pct >= 100 || completed.has(course.id)) status = 'done';
    else if (!foundCurrent && (pct > 0 || profile.activeCourseId === course.id || steps.length === 0)) {
      status = 'current';
      foundCurrent = true;
    } else if (foundCurrent && pct === 0) {
      status = 'locked';
    }

    const reasonParts: string[] = [];
    if (pct > 0 && pct < 100) reasonParts.push(`Resume at ${Math.round(pct)}%`);
    const weakHit = weaknesses.find((w) =>
      info.title.toLowerCase().includes(w.name.toLowerCase())
    );
    if (weakHit) reasonParts.push(`Closes gap: ${weakHit.name}`);
    if (profile.activeCourseId === course.id) reasonParts.push('Your active course');
    if (reasonParts.length === 0) reasonParts.push('Recommended next in your path');

    steps.push({
      id: `${course.id}:${lesson.id}`,
      courseId: course.id,
      lessonId: lesson.id,
      courseTitle: info.title,
      lessonTitle: lesson.title,
      reason: reasonParts.join(' · '),
      estimatedMinutes: lesson.duration || 20,
      status,
      href: `/courses/${course.id}/${lesson.id}`,
      progressPercent: pct,
    });
  }

  const focusAreas = [
    ...weaknesses.slice(0, 2).map((w) => w.name),
    ...strengths.slice(0, 1).map((s) => `Level up ${s.name}`),
  ].slice(0, 3);

  const doneCount = Object.values(progress).filter((p) => p >= 100).length;
  const startedCount = Object.keys(progress).length;
  const completionRate =
    catalogIds.length > 0 ? Math.round((doneCount / catalogIds.length) * 100) : 0;

  const nextAction = steps.find((s) => s.status === 'current') || steps.find((s) => s.status === 'recommended') || null;
  const estimatedMinutesToday = steps
    .filter((s) => s.status === 'current' || s.status === 'recommended')
    .slice(0, 2)
    .reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return {
    headline:
      nextAction != null
        ? `Today: ${nextAction.lessonTitle}`
        : startedCount > 0
          ? 'Keep exploring — pick a fresh track'
          : 'Start your first course to unlock a living path',
    focusAreas: focusAreas.length ? focusAreas : ['Foundations', 'Practice', 'Projects'],
    nextAction,
    steps,
    completionRate,
    estimatedMinutesToday,
  };
}

export function buildDailyMissions(
  profile: UserProfile,
  dueReviews: number
): DailyMission[] {
  const path = buildAdaptiveLearningPath(profile);
  const missions: DailyMission[] = [];

  if (path.nextAction) {
    missions.push({
      id: 'continue-lesson',
      title: 'Continue your path',
      description: `${path.nextAction.courseTitle} → ${path.nextAction.lessonTitle}`,
      href: path.nextAction.href,
      xpReward: 25,
      kind: 'continue',
      done: false,
    });
  }

  missions.push({
    id: 'spaced-review',
    title: dueReviews > 0 ? `Review ${dueReviews} card${dueReviews === 1 ? '' : 's'}` : 'Open Study Lab',
    description:
      dueReviews > 0
        ? 'Spaced repetition keeps knowledge sticky.'
        : 'Add cards from lessons, then review daily.',
    href: '/learn/study',
    xpReward: 15,
    kind: 'review',
    done: dueReviews === 0 && (profile.dailyStreak || 0) > 0,
  });

  missions.push({
    id: 'streak',
    title:
      (profile.dailyStreak || 0) > 0
        ? `Protect your ${profile.dailyStreak}-day streak`
        : 'Start a learning streak today',
    description: 'Complete any lesson or review session before midnight.',
    href: path.nextAction?.href || '/courses',
    xpReward: 10,
    kind: 'streak',
    done: false,
  });

  const unexplored = catalog.find((c) => !(profile.courseProgress || {})[c.id]);
  if (unexplored) {
    missions.push({
      id: 'explore',
      title: 'Discover something new',
      description: unexplored.title,
      href: `/courses/${unexplored.id}`,
      xpReward: 20,
      kind: 'explore',
      done: false,
    });
  }

  return missions.slice(0, 4);
}

// ── Search ─────────────────────────────────────────────────────────────

export function searchLearningCatalog(
  queryText: string,
  progress: Record<string, number> = {}
): SearchHit[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const info of catalog) {
    const course = getCourse(info.id);
    const courseMatch =
      info.title.toLowerCase().includes(q) || info.description.toLowerCase().includes(q);

    if (courseMatch) {
      hits.push({
        type: 'course',
        courseId: info.id,
        title: info.title,
        subtitle: info.description.slice(0, 120),
        href: `/courses/${info.id}`,
        progress: progress[info.id] ?? 0,
      });
    }

    if (!course) continue;
    for (const lesson of course.lessons) {
      const blob = [
        lesson.title,
        lesson.introduction?.text || '',
        ...(lesson.objectives || []),
        ...(lesson.keyTakeaways || []),
      ]
        .join(' ')
        .toLowerCase();
      if (blob.includes(q) || courseMatch) {
        if (!courseMatch || lesson.title.toLowerCase().includes(q)) {
          hits.push({
            type: 'lesson',
            courseId: info.id,
            lessonId: lesson.id,
            title: lesson.title,
            subtitle: info.title,
            href: `/courses/${info.id}/${lesson.id}`,
            progress: progress[info.id] ?? 0,
          });
        }
      }
    }
  }

  return hits.slice(0, 40);
}

// ── Flashcards from lesson quizzes ─────────────────────────────────────

export function extractCardsFromLesson(
  course: Course,
  lesson: Lesson
): Omit<StudyCard, 'id' | 'userId' | 'ease' | 'intervalDays' | 'repetitions' | 'nextReviewAt' | 'createdAt'>[] {
  const cards: Omit<
    StudyCard,
    'id' | 'userId' | 'ease' | 'intervalDays' | 'repetitions' | 'nextReviewAt' | 'createdAt'
  >[] = [];

  const quizzes = [lesson.practice, lesson.assessment];
  for (const quiz of quizzes) {
    for (const question of quiz?.questions || []) {
      cards.push({
        courseId: course.id,
        lessonId: lesson.id,
        front: question.question,
        back: question.correctAnswer,
      });
    }
  }

  for (const takeaway of lesson.keyTakeaways || []) {
    cards.push({
      courseId: course.id,
      lessonId: lesson.id,
      front: `Key takeaway — ${lesson.title}`,
      back: takeaway,
    });
  }

  return cards;
}

// ── Firestore: notes ───────────────────────────────────────────────────

export async function listLessonNotes(userId: string): Promise<LessonNote[]> {
  const q = query(collection(db, 'lessonNotes'), where('userId', '==', userId), limit(100));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        courseTitle: data.courseTitle || '',
        lessonTitle: data.lessonTitle || '',
        body: data.body || '',
        updatedAt: toDate(data.updatedAt),
        createdAt: toDate(data.createdAt),
      };
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getLessonNote(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<LessonNote | null> {
  const noteId = `${userId}_${courseId}_${lessonId}`;
  const snap = await getDoc(doc(db, 'lessonNotes', noteId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    courseId: data.courseId,
    lessonId: data.lessonId,
    courseTitle: data.courseTitle || '',
    lessonTitle: data.lessonTitle || '',
    body: data.body || '',
    updatedAt: toDate(data.updatedAt),
    createdAt: toDate(data.createdAt),
  };
}

export async function upsertLessonNote(input: {
  userId: string;
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  body: string;
}): Promise<void> {
  const noteId = `${input.userId}_${input.courseId}_${input.lessonId}`;
  const ref = doc(db, 'lessonNotes', noteId);
  const existing = await getDoc(ref);
  await setDoc(
    ref,
    {
      userId: input.userId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      courseTitle: input.courseTitle,
      lessonTitle: input.lessonTitle,
      body: input.body,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
}

export async function deleteLessonNote(noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'lessonNotes', noteId));
}

// ── Firestore: study cards ─────────────────────────────────────────────

export async function listStudyCards(userId: string): Promise<StudyCard[]> {
  const q = query(collection(db, 'studyCards'), where('userId', '==', userId), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      courseId: data.courseId,
      lessonId: data.lessonId,
      front: data.front,
      back: data.back,
      ease: typeof data.ease === 'number' ? data.ease : 2.5,
      intervalDays: typeof data.intervalDays === 'number' ? data.intervalDays : 0,
      repetitions: typeof data.repetitions === 'number' ? data.repetitions : 0,
      nextReviewAt: toDate(data.nextReviewAt),
      lastReviewedAt: data.lastReviewedAt ? toDate(data.lastReviewedAt) : undefined,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function listDueStudyCards(userId: string): Promise<StudyCard[]> {
  const cards = await listStudyCards(userId);
  const now = Date.now();
  return cards
    .filter((c) => c.nextReviewAt.getTime() <= now)
    .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
}

export async function importLessonStudyCards(
  userId: string,
  course: Course,
  lesson: Lesson
): Promise<number> {
  const existing = await listStudyCards(userId);
  const existingKeys = new Set(existing.map((c) => `${c.courseId}:${c.lessonId}:${c.front}`));
  const extracted = extractCardsFromLesson(course, lesson);
  let added = 0;

  for (const card of extracted) {
    const key = `${card.courseId}:${card.lessonId}:${card.front}`;
    if (existingKeys.has(key)) continue;
    await addDoc(collection(db, 'studyCards'), {
      userId,
      courseId: card.courseId,
      lessonId: card.lessonId,
      front: card.front,
      back: card.back,
      ease: 2.5,
      intervalDays: 0,
      repetitions: 0,
      nextReviewAt: new Date(),
      createdAt: serverTimestamp(),
    });
    existingKeys.add(key);
    added += 1;
  }

  return added;
}

export async function reviewStudyCard(
  cardId: string,
  card: StudyCard,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): Promise<void> {
  const next = scheduleReview(card, quality);
  await updateDoc(doc(db, 'studyCards', cardId), {
    ease: next.ease,
    intervalDays: next.intervalDays,
    repetitions: next.repetitions,
    nextReviewAt: next.nextReviewAt,
    lastReviewedAt: next.lastReviewedAt,
  });
}

// ── Verifiable certificates ────────────────────────────────────────────

function makeVerifyCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'PA-';
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function registerVerifiableCertificate(input: {
  userId: string;
  type: 'course' | 'training';
  title: string;
  skillOrCourseId: string;
  recipientName: string;
  completionSummary?: string;
}): Promise<VerifiableCertificate> {
  const code = makeVerifyCode();
  const issuedAt = new Date().toISOString();
  const ref = doc(collection(db, 'certificates'));
  const record: VerifiableCertificate = {
    id: ref.id,
    code,
    userId: input.userId,
    type: input.type,
    title: input.title,
    skillOrCourseId: input.skillOrCourseId,
    recipientName: input.recipientName,
    issuedAt,
    completionSummary: input.completionSummary,
  };
  await setDoc(ref, {
    ...record,
    createdAt: serverTimestamp(),
  });
  // Public lookup by code
  await setDoc(doc(db, 'certificateCodes', code), {
    certificateId: ref.id,
    code,
    createdAt: serverTimestamp(),
  });
  return record;
}

export async function getCertificateByCode(code: string): Promise<VerifiableCertificate | null> {
  const normalized = code.trim().toUpperCase();
  const codeSnap = await getDoc(doc(db, 'certificateCodes', normalized));
  if (!codeSnap.exists()) return null;
  const certificateId = codeSnap.data().certificateId as string;
  const certSnap = await getDoc(doc(db, 'certificates', certificateId));
  if (!certSnap.exists()) return null;
  const data = certSnap.data();
  return {
    id: certSnap.id,
    code: data.code,
    userId: data.userId,
    type: data.type,
    title: data.title,
    skillOrCourseId: data.skillOrCourseId,
    recipientName: data.recipientName,
    issuedAt: data.issuedAt,
    completionSummary: data.completionSummary,
  };
}

export async function listUserCertificates(userId: string): Promise<VerifiableCertificate[]> {
  const q = query(collection(db, 'certificates'), where('userId', '==', userId), limit(50));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        code: data.code,
        userId: data.userId,
        type: data.type,
        title: data.title,
        skillOrCourseId: data.skillOrCourseId,
        recipientName: data.recipientName,
        issuedAt: data.issuedAt,
        completionSummary: data.completionSummary,
      };
    })
    .sort((a, b) => String(b.issuedAt).localeCompare(String(a.issuedAt)));
}

// ── Pulse (hub data) ───────────────────────────────────────────────────

export async function getLearningPulse(profile: UserProfile): Promise<LearningPulse> {
  let dueReviews = 0;
  let notesCount = 0;
  try {
    const [due, notes] = await Promise.all([
      listDueStudyCards(profile.uid),
      listLessonNotes(profile.uid),
    ]);
    dueReviews = due.length;
    notesCount = notes.length;
  } catch {
    // Offline / rules — still return path-only pulse
  }

  const path = buildAdaptiveLearningPath(profile);
  const missions = buildDailyMissions(profile, dueReviews);

  return {
    dueReviews,
    notesCount,
    missions,
    path,
    continueHref: path.nextAction?.href ?? null,
    continueLabel: path.nextAction
      ? `${path.nextAction.courseTitle} · ${path.nextAction.lessonTitle}`
      : null,
  };
}

export { todayKey };
