import {
  isAdminProfile,
  isInstructorProfile,
  resolveUserRole,
} from '@/lib/admin';
import type { UserProfile } from '@/lib/firebase';

export const LEARNER_DASHBOARD = '/dashboard';
export const INSTRUCTOR_DASHBOARD = '/instructor/dashboard';
export const INSTRUCTOR_TEACH = '/instructor/teach';
export const INSTRUCTOR_COURSE_CREATOR = '/instructor/course-creator';
export const INSTRUCTOR_BOOTCAMP_STUDIO = '/instructor/bootcamp-studio';
export const ADMIN_PORTAL = '/admin-portal';

/** Paths that must only be used inside the instructor portal (learners are redirected). */
export const INSTRUCTOR_ONLY_PATHS = [
  INSTRUCTOR_TEACH,
  INSTRUCTOR_COURSE_CREATOR,
  INSTRUCTOR_BOOTCAMP_STUDIO,
  '/instructor/dashboard',
] as const;
export const LEARNER_VIEW_PARAM = 'view';
export const LEARNER_VIEW_VALUE = 'learner';

export function learnerDashboardHref(asLearnerPreview = false): string {
  if (!asLearnerPreview) return LEARNER_DASHBOARD;
  return `${LEARNER_DASHBOARD}?${LEARNER_VIEW_PARAM}=${LEARNER_VIEW_VALUE}`;
}

export function isLearnerPreviewView(searchParams: URLSearchParams | null): boolean {
  return searchParams?.get(LEARNER_VIEW_PARAM) === LEARNER_VIEW_VALUE;
}

/** Default landing route after sign-in, based on account role. */
export function getPostAuthRedirect(
  profile: Pick<UserProfile, 'role' | 'email'> | null | undefined,
  email?: string | null
): string {
  if (!profile) return LEARNER_DASHBOARD;
  if (isAdminProfile(profile, email)) return ADMIN_PORTAL;
  if (isInstructorProfile(profile, email)) return INSTRUCTOR_DASHBOARD;
  return LEARNER_DASHBOARD;
}

/** Learner dashboard is only the default home for learners; instructors need ?view=learner. */
export function canAccessLearnerDashboard(
  profile: Pick<UserProfile, 'role' | 'email'> | null | undefined,
  email?: string | null,
  allowLearnerPreview: boolean
): boolean {
  if (!profile) return false;
  const role = resolveUserRole(profile, email);
  if (role === 'learner' || role === 'admin') return true;
  return allowLearnerPreview && role === 'instructor';
}
