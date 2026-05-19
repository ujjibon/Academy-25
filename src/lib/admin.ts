import type { UserProfile } from '@/lib/firebase';

export type UserRole = 'learner' | 'instructor' | 'admin' | 'user';

/** Normalize legacy `user` role to learner */
export function normalizeRole(role: string | undefined): 'learner' | 'instructor' | 'admin' {
  if (role === 'admin') return 'admin';
  if (role === 'instructor') return 'instructor';
  if (role === 'user') return 'learner';
  return role === 'learner' ? 'learner' : 'learner';
}

/** Default admin email when signing in with username `admin`. */
export const DEFAULT_ADMIN_EMAIL = 'admin@peeracademy.com';

export function getAdminLoginEmail(): string {
  return (
    process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_ADMIN_EMAIL
  );
}

/** Map username `admin` or a full email to the Firebase auth email. */
export function resolveAdminLoginEmail(input: string): string {
  const value = input.trim().toLowerCase();
  if (value.includes('@')) return value;
  if (value === 'admin') return getAdminLoginEmail();
  return `${value}@peeracademy.com`;
}

export function getAdminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const fromEnv = raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const loginEmail = getAdminLoginEmail();
  if (!fromEnv.includes(loginEmail)) {
    return [...fromEnv, loginEmail];
  }
  return fromEnv;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmailsFromEnv().includes(email.trim().toLowerCase());
}

export function resolveUserRole(
  profile: Pick<UserProfile, 'role' | 'email'> | null | undefined,
  email?: string | null
): 'learner' | 'instructor' | 'admin' {
  if (profile?.role === 'admin' || isAdminEmail(profile?.email || email)) return 'admin';
  if (profile?.role === 'instructor') return 'instructor';
  return normalizeRole(profile?.role);
}

export function isInstructorOrAdmin(
  profile: Pick<UserProfile, 'role' | 'email'> | null | undefined,
  email?: string | null
): boolean {
  const role = resolveUserRole(profile, email);
  return role === 'admin' || role === 'instructor';
}

export function isAdminProfile(
  profile: Pick<UserProfile, 'role' | 'email'> | null | undefined,
  email?: string | null
): boolean {
  return resolveUserRole(profile, email) === 'admin';
}

/** After Firebase sign-in, confirm this account may access the admin portal. */
export async function verifyAdminAccess(
  getProfile: (uid: string) => Promise<Pick<UserProfile, 'role' | 'email'> | null>,
  uid: string,
  email: string | null | undefined
): Promise<boolean> {
  const profile = await getProfile(uid);
  return isAdminProfile(profile, email);
}

export function isInstructorProfile(
  profile: Pick<UserProfile, 'role' | 'email'> | null | undefined,
  email?: string | null
): boolean {
  return resolveUserRole(profile, email) === 'instructor';
}

/** After Firebase sign-in, confirm this account may access the instructor portal. */
export async function verifyInstructorAccess(
  getProfile: (uid: string) => Promise<Pick<UserProfile, 'role' | 'email'> | null>,
  uid: string,
  email: string | null | undefined
): Promise<boolean> {
  const profile = await getProfile(uid);
  return isInstructorOrAdmin(profile, email);
}
