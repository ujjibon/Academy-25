import { NextRequest } from 'next/server';
import { verifyIdToken, type VerifiedAdmin } from '@/lib/server-admin-auth';

export type VerifiedUser = VerifiedAdmin;

export async function requireUserFromRequest(
  request: NextRequest
): Promise<VerifiedUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  return verifyIdToken(token);
}
