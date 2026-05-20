import { NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/server-user-auth';
import {
  getPayPalSubscription,
  mapPayPalStatusToSubscription,
} from '@/lib/paypal-server';
import type { SubscriptionPlanId } from '@/lib/subscription-types';

export async function POST(request: NextRequest) {
  const user = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { subscriptionId?: string; planId?: SubscriptionPlanId };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { subscriptionId, planId } = body;
  if (!subscriptionId || !planId || planId === 'free') {
    return NextResponse.json({ error: 'Missing subscription or plan' }, { status: 400 });
  }

  const details = await getPayPalSubscription(subscriptionId);
  if (!details) {
    return NextResponse.json({ error: 'Could not verify subscription with PayPal' }, { status: 400 });
  }

  const status = mapPayPalStatusToSubscription(details.status);
  const nextBilling = details.billing_info?.next_billing_time;

  const subscription = {
    planId,
    status,
    paypalSubscriptionId: details.id,
    paypalPayerId: details.subscriber?.payer_id,
    currentPeriodEnd: nextBilling ? new Date(nextBilling).toISOString() : undefined,
    cancelAtPeriodEnd: false,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ subscription });
}
