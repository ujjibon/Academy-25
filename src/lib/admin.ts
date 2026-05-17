import type { UserProfile } from '@/lib/firebase';

export type UserRole = 'user' | 'admin';

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
): UserRole {
  if (profile?.role === 'admin') return 'admin';
  if (isAdminEmail(profile?.email || email)) return 'admin';
  return 'user';
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
