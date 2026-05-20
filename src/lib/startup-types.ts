export type IdeaStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_changes'
  | 'approved'
  | 'rejected';

export type PitchDeckStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_changes'
  | 'approved'
  | 'rejected';

export type MentorshipBookingStatus = 'scheduled' | 'completed' | 'cancelled';

export type StartupIdea = {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  title: string;
  problem: string;
  solution: string;
  market: string;
  traction: string;
  team: string;
  ask: string;
  stage: 'discovery' | 'validation' | 'build' | 'scale';
  status: IdeaStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type StartupPitchDeck = {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  ideaId: string;
  ideaTitle?: string;
  title: string;
  deckUrl: string;
  status: PitchDeckStatus;
  reviewerNotes: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MentorshipSlot = {
  id: string;
  mentorName: string;
  topic: string;
  startsAt: Date;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  createdAt: Date;
};

export type MentorshipBooking = {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  slotId: string;
  ideaId?: string;
  topic: string;
  status: MentorshipBookingStatus;
  createdAt: Date;
};

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In review',
  needs_changes: 'Needs changes',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const PITCH_STATUS_LABELS: Record<PitchDeckStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In review',
  needs_changes: 'Needs changes',
  approved: 'Approved',
  rejected: 'Rejected',
};
