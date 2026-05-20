import type { SubscriptionPlanId } from '@/lib/subscription-types';
import { getPlanById, resolvePayPalPlanId } from '@/lib/subscription-types';

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    console.error('PayPal token error:', await res.text());
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function createPayPalSubscription(
  planId: SubscriptionPlanId,
  returnUrl: string,
  cancelUrl: string
): Promise<{ subscriptionId: string; approvalUrl: string } | { error: string }> {
  if (planId === 'free') {
    return { error: 'Free plan does not require payment.' };
  }

  const plan = getPlanById(planId);
  const paypalPlanId = resolvePayPalPlanId(plan);
  if (!paypalPlanId) {
    return {
      error: `PayPal plan not configured. Set ${plan.paypalPlanIdEnvKey} in .env.local.`,
    };
  }

  const token = await getPayPalAccessToken();
  if (!token) {
    return { error: 'PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.' };
  }

  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: paypalPlanId,
      application_context: {
        brand_name: 'Peer Academy',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    links?: { rel: string; href: string }[];
    message?: string;
    details?: { issue: string; description: string }[];
  };

  if (!res.ok) {
    const detail = data.details?.[0]?.description ?? data.message ?? 'PayPal request failed';
    console.error('PayPal create subscription:', data);
    return { error: detail };
  }

  const approval = data.links?.find((l) => l.rel === 'approve');
  if (!data.id || !approval?.href) {
    return { error: 'PayPal did not return an approval link.' };
  }

  return { subscriptionId: data.id, approvalUrl: approval.href };
}

export type PayPalSubscriptionDetails = {
  id: string;
  status: string;
  plan_id?: string;
  subscriber?: { payer_id?: string };
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string };
  };
};

export async function getPayPalSubscription(
  subscriptionId: string
): Promise<PayPalSubscriptionDetails | null> {
  const token = await getPayPalAccessToken();
  if (!token) return null;

  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return (await res.json()) as PayPalSubscriptionDetails;
}

export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  const token = await getPayPalAccessToken();
  if (!token) {
    return { ok: false, error: 'PayPal is not configured.' };
  }

  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: reason ?? 'Customer requested cancellation',
      }),
    }
  );

  if (res.ok || res.status === 204) return { ok: true };

  const data = (await res.json()) as { message?: string };
  return { ok: false, error: data.message ?? 'Failed to cancel subscription' };
}

export function mapPayPalStatusToSubscription(
  paypalStatus: string
): 'active' | 'cancelled' | 'past_due' | 'pending' | 'none' {
  switch (paypalStatus) {
    case 'ACTIVE':
      return 'active';
    case 'APPROVAL_PENDING':
    case 'APPROVED':
      return 'pending';
    case 'SUSPENDED':
    case 'EXPIRED':
      return 'past_due';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'none';
  }
}
