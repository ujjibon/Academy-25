'use client';

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, shouldAttemptFirestoreOperation } from '@/lib/firebase';
import {
  type CachedLessonSlides,
  lessonSlidesDocId,
} from '@/lib/lesson-slides-types';
import type { ClassroomSlideGeneratorOutput } from '@/ai/flows/classroom-slide-generator-flow';

export async function getLessonSlidesFromFirestore(
  courseId: string,
  lessonId: string
): Promise<CachedLessonSlides | null> {
  if (!shouldAttemptFirestoreOperation()) return null;
  try {
    const snap = await getDoc(
      doc(db, 'lessonClassroomSlides', lessonSlidesDocId(courseId, lessonId))
    );
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!Array.isArray(data.slides) || data.slides.length === 0) return null;
    return data as CachedLessonSlides;
  } catch (error) {
    console.warn('Failed to load cached lesson slides:', error);
    return null;
  }
}

export async function saveLessonSlidesToFirestore(
  courseId: string,
  lessonId: string,
  payload: ClassroomSlideGeneratorOutput
): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) return;
  try {
    const cached: CachedLessonSlides = {
      ...payload,
      courseId,
      lessonId,
      generatedAt: new Date().toISOString(),
    };
    await setDoc(
      doc(db, 'lessonClassroomSlides', lessonSlidesDocId(courseId, lessonId)),
      { ...cached, updatedAt: serverTimestamp() }
    );
  } catch (error) {
    console.warn('Failed to save lesson slides to Firestore:', error);
  }
}
