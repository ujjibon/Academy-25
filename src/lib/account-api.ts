import { auth } from '@/lib/firebase';
import type { SubscriptionPlanId } from '@/lib/subscription-types';
import type { UserSubscription } from '@/lib/subscription-types';

async function authHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in.');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function uploadAvatar(file: File): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in.');

  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/account/avatar', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'Upload failed');
  }
  return data.path as string;
}

export async function createPayPalCheckout(
  planId: SubscriptionPlanId
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const res = await fetch('/api/paypal/create-subscription', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ planId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Could not start checkout');
  return data;
}

export async function activatePayPalSubscription(
  subscriptionId: string,
  planId: SubscriptionPlanId
): Promise<UserSubscription> {
  const res = await fetch('/api/paypal/activate-subscription', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ subscriptionId, planId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Activation failed');

  const sub = data.subscription;
  return {
    planId: sub.planId,
    status: sub.status,
    paypalSubscriptionId: sub.paypalSubscriptionId,
    paypalPayerId: sub.paypalPayerId,
    currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : undefined,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    startedAt: sub.startedAt ? new Date(sub.startedAt) : undefined,
    updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : undefined,
  };
}

export async function cancelPayPalSubscription(
  subscriptionId: string
): Promise<Partial<UserSubscription>> {
  const res = await fetch('/api/paypal/cancel-subscription', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ subscriptionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Cancel failed');

  const sub = data.subscription;
  return {
    planId: 'free',
    status: 'cancelled',
    cancelAtPeriodEnd: true,
    updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : new Date(),
  };
}

const PENDING_SUB_KEY = 'peer_academy_pending_paypal';

export function storePendingPayPalSubscription(
  subscriptionId: string,
  planId: SubscriptionPlanId
) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    PENDING_SUB_KEY,
    JSON.stringify({ subscriptionId, planId })
  );
}

export function consumePendingPayPalSubscription(): {
  subscriptionId: string;
  planId: SubscriptionPlanId;
} | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_SUB_KEY);
  sessionStorage.removeItem(PENDING_SUB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { subscriptionId: string; planId: SubscriptionPlanId };
  } catch {
    return null;
  }
}
