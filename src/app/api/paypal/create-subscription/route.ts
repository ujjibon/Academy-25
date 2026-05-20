import { NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/server-user-auth';
import { createPayPalSubscription } from '@/lib/paypal-server';
import type { SubscriptionPlanId } from '@/lib/subscription-types';

export async function POST(request: NextRequest) {
  const user = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { planId?: SubscriptionPlanId };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const planId = body.planId;
  if (!planId || planId === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const returnUrl = `${appUrl}/account?tab=subscription&paypal=success`;
  const cancelUrl = `${appUrl}/account?tab=subscription&paypal=cancelled`;

  const result = await createPayPalSubscription(planId, returnUrl, cancelUrl);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    subscriptionId: result.subscriptionId,
    approvalUrl: result.approvalUrl,
  });
}
