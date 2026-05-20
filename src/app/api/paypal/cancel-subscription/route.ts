import { NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/server-user-auth';
import { cancelPayPalSubscription } from '@/lib/paypal-server';

export async function POST(request: NextRequest) {
  const user = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { subscriptionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.subscriptionId) {
    return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });
  }

  const result = await cancelPayPalSubscription(body.subscriptionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Cancel failed' }, { status: 400 });
  }

  return NextResponse.json({
    subscription: {
      planId: 'free' as const,
      status: 'cancelled' as const,
      cancelAtPeriodEnd: true,
      updatedAt: new Date().toISOString(),
    },
  });
}
