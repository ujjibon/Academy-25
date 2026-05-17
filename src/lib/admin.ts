import type { UserProfile } from '@/lib/firebase';

export type UserRole = 'user' | 'admin';

export function getAdminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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
