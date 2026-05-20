'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db, shouldAttemptFirestoreOperation } from '@/lib/firebase';
import type {
  StartupIdea,
  StartupPitchDeck,
  MentorshipSlot,
  MentorshipBooking,
  IdeaStatus,
  PitchDeckStatus,
  MentorshipBookingStatus,
} from '@/lib/startup-types';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function mapIdea(id: string, data: Record<string, unknown>): StartupIdea {
  return {
    id,
    ownerId: (data.ownerId as string) || '',
    ownerEmail: data.ownerEmail as string | undefined,
    ownerName: data.ownerName as string | undefined,
    title: (data.title as string) || '',
    problem: (data.problem as string) || '',
    solution: (data.solution as string) || '',
    market: (data.market as string) || '',
    traction: (data.traction as string) || '',
    team: (data.team as string) || '',
    ask: (data.ask as string) || '',
    stage: (data.stage as StartupIdea['stage']) || 'discovery',
    status: (data.status as IdeaStatus) || 'draft',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapPitch(id: string, data: Record<string, unknown>): StartupPitchDeck {
  return {
    id,
    ownerId: (data.ownerId as string) || '',
    ownerEmail: data.ownerEmail as string | undefined,
    ownerName: data.ownerName as string | undefined,
    ideaId: (data.ideaId as string) || '',
    ideaTitle: data.ideaTitle as string | undefined,
    title: (data.title as string) || '',
    deckUrl: (data.deckUrl as string) || '',
    status: (data.status as PitchDeckStatus) || 'draft',
    reviewerNotes: (data.reviewerNotes as string) || '',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapSlot(id: string, data: Record<string, unknown>): MentorshipSlot {
  return {
    id,
    mentorName: (data.mentorName as string) || '',
    topic: (data.topic as string) || '',
    startsAt: toDate(data.startsAt),
    durationMinutes: (data.durationMinutes as number) || 30,
    capacity: (data.capacity as number) || 1,
    bookedCount: (data.bookedCount as number) || 0,
    createdAt: toDate(data.createdAt),
  };
}

function mapBooking(id: string, data: Record<string, unknown>): MentorshipBooking {
  return {
    id,
    userId: (data.userId as string) || '',
    userEmail: data.userEmail as string | undefined,
    userName: data.userName as string | undefined,
    slotId: (data.slotId as string) || '',
    ideaId: data.ideaId as string | undefined,
    topic: (data.topic as string) || '',
    status: (data.status as MentorshipBookingStatus) || 'scheduled',
    createdAt: toDate(data.createdAt),
  };
}

// ——— Ideas ———

export type CreateIdeaInput = {
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  title: string;
  problem?: string;
  solution?: string;
  market?: string;
  traction?: string;
  team?: string;
  ask?: string;
  stage?: StartupIdea['stage'];
  status?: IdeaStatus;
};

export async function createStartupIdea(input: CreateIdeaInput): Promise<string> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  const ref = await addDoc(collection(db, 'startupIdeas'), {
    ownerId: input.ownerId,
    ownerEmail: input.ownerEmail ?? '',
    ownerName: input.ownerName ?? '',
    title: input.title,
    problem: input.problem ?? '',
    solution: input.solution ?? '',
    market: input.market ?? '',
    traction: input.traction ?? '',
    team: input.team ?? '',
    ask: input.ask ?? '',
    stage: input.stage ?? 'discovery',
    status: input.status ?? 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStartupIdea(
  ideaId: string,
  patch: Partial<Omit<CreateIdeaInput, 'ownerId'>> & { status?: IdeaStatus }
): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  await updateDoc(doc(db, 'startupIdeas', ideaId), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteStartupIdea(ideaId: string): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  await deleteDoc(doc(db, 'startupIdeas', ideaId));
}

export async function getStartupIdea(ideaId: string): Promise<StartupIdea | null> {
  if (!shouldAttemptFirestoreOperation()) return null;
  const snap = await getDoc(doc(db, 'startupIdeas', ideaId));
  if (!snap.exists()) return null;
  return mapIdea(snap.id, snap.data());
}

export async function getStartupIdeasByOwner(ownerId: string): Promise<StartupIdea[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(collection(db, 'startupIdeas'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapIdea(d.id, d.data()))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getAllStartupIdeas(): Promise<StartupIdea[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const snap = await getDocs(
    query(collection(db, 'startupIdeas'), orderBy('updatedAt', 'desc'))
  );
  return snap.docs.map((d) => mapIdea(d.id, d.data()));
}

// ——— Pitch decks ———

export type CreatePitchDeckInput = {
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  ideaId: string;
  ideaTitle?: string;
  title: string;
  deckUrl: string;
  status?: PitchDeckStatus;
};

export async function createPitchDeck(input: CreatePitchDeckInput): Promise<string> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  const ref = await addDoc(collection(db, 'startupPitchDecks'), {
    ownerId: input.ownerId,
    ownerEmail: input.ownerEmail ?? '',
    ownerName: input.ownerName ?? '',
    ideaId: input.ideaId,
    ideaTitle: input.ideaTitle ?? '',
    title: input.title,
    deckUrl: input.deckUrl,
    status: input.status ?? 'submitted',
    reviewerNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePitchDeck(
  id: string,
  patch: Partial<{
    title: string;
    deckUrl: string;
    status: PitchDeckStatus;
    reviewerNotes: string;
  }>
): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  await updateDoc(doc(db, 'startupPitchDecks', id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deletePitchDeck(id: string): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  await deleteDoc(doc(db, 'startupPitchDecks', id));
}

export async function getPitchDecksByOwner(ownerId: string): Promise<StartupPitchDeck[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(collection(db, 'startupPitchDecks'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapPitch(d.id, d.data()))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getPitchDecksByIdea(ideaId: string): Promise<StartupPitchDeck[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(collection(db, 'startupPitchDecks'), where('ideaId', '==', ideaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPitch(d.id, d.data()));
}

export async function getAllPitchDecks(): Promise<StartupPitchDeck[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const snap = await getDocs(
    query(collection(db, 'startupPitchDecks'), orderBy('updatedAt', 'desc'))
  );
  return snap.docs.map((d) => mapPitch(d.id, d.data()));
}

// ——— Mentorship slots ———

export type CreateSlotInput = {
  mentorName: string;
  topic: string;
  startsAt: Date;
  durationMinutes?: number;
  capacity?: number;
};

export async function createMentorshipSlot(input: CreateSlotInput): Promise<string> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  const ref = await addDoc(collection(db, 'mentorshipSlots'), {
    mentorName: input.mentorName,
    topic: input.topic,
    startsAt: Timestamp.fromDate(input.startsAt),
    durationMinutes: input.durationMinutes ?? 30,
    capacity: input.capacity ?? 1,
    bookedCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMentorshipSlot(
  id: string,
  patch: Partial<CreateSlotInput>
): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  const data: Record<string, unknown> = { ...patch };
  if (patch.startsAt) data.startsAt = Timestamp.fromDate(patch.startsAt);
  await updateDoc(doc(db, 'mentorshipSlots', id), data);
}

export async function deleteMentorshipSlot(id: string): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  await deleteDoc(doc(db, 'mentorshipSlots', id));
}

export async function getAvailableMentorshipSlots(): Promise<MentorshipSlot[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const now = Timestamp.now();
  const q = query(collection(db, 'mentorshipSlots'), where('startsAt', '>=', now));
  const snap = await getDocs(q);
  const slots = snap.docs.map((d) => mapSlot(d.id, d.data()));
  return slots
    .filter((s) => s.bookedCount < s.capacity)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export async function getAllMentorshipSlots(): Promise<MentorshipSlot[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const snap = await getDocs(collection(db, 'mentorshipSlots'));
  return snap.docs
    .map((d) => mapSlot(d.id, d.data()))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
}

// ——— Bookings ———

export async function createMentorshipBooking(input: {
  userId: string;
  userEmail?: string;
  userName?: string;
  slotId: string;
  ideaId?: string;
  topic: string;
}): Promise<string> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  const slotRef = doc(db, 'mentorshipSlots', input.slotId);
  const slotSnap = await getDoc(slotRef);
  if (!slotSnap.exists()) throw new Error('Slot not found');
  const slot = mapSlot(slotSnap.id, slotSnap.data());
  if (slot.bookedCount >= slot.capacity) throw new Error('Slot is full');

  const ref = await addDoc(collection(db, 'mentorshipBookings'), {
    userId: input.userId,
    userEmail: input.userEmail ?? '',
    userName: input.userName ?? '',
    slotId: input.slotId,
    ideaId: input.ideaId ?? '',
    topic: input.topic,
    status: 'scheduled' as MentorshipBookingStatus,
    createdAt: serverTimestamp(),
  });
  await updateDoc(slotRef, { bookedCount: increment(1) });
  return ref.id;
}

export async function updateMentorshipBooking(
  id: string,
  patch: { status?: MentorshipBookingStatus; topic?: string }
): Promise<void> {
  if (!shouldAttemptFirestoreOperation()) throw new Error('Offline');
  const bookingRef = doc(db, 'mentorshipBookings', id);
  if (patch.status === 'cancelled') {
    const snap = await getDoc(bookingRef);
    if (snap.exists() && snap.data().status !== 'cancelled') {
      const slotId = snap.data().slotId as string;
      await updateDoc(doc(db, 'mentorshipSlots', slotId), { bookedCount: increment(-1) });
    }
  }
  await updateDoc(bookingRef, patch);
}

export async function getBookingsByUser(userId: string): Promise<MentorshipBooking[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(collection(db, 'mentorshipBookings'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapBooking(d.id, d.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAllMentorshipBookings(): Promise<MentorshipBooking[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const snap = await getDocs(
    query(collection(db, 'mentorshipBookings'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => mapBooking(d.id, d.data()));
}
