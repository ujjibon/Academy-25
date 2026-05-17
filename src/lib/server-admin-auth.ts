import { NextRequest } from 'next/server';
import { getAdminEmailsFromEnv } from '@/lib/admin';

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB47TJPJJShQQrKOJ91baovmWCCU4HSrdo';

export type VerifiedAdmin = {
  uid: string;
  email: string;
};

export async function verifyIdToken(idToken: string): Promise<VerifiedAdmin | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const user = data.users?.[0];
    if (!user?.localId || !user?.email) return null;

    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}

export async function requireAdminFromRequest(
  request: NextRequest
): Promise<VerifiedAdmin | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const verified = await verifyIdToken(token);
  if (!verified) return null;

  const adminEmails = getAdminEmailsFromEnv();
  if (adminEmails.length === 0) {
    return null;
  }
  if (!adminEmails.includes(verified.email.toLowerCase())) {
    return null;
  }

  return verified;
}
