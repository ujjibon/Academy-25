export type SubscriptionPlanId = 'free' | 'pro' | 'premium';

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'pending';

export interface UserSubscription {
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  paypalSubscriptionId?: string;
  paypalPayerId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  startedAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceMonthly: number;
  priceLabel: string;
  description: string;
  features: string[];
  popular?: boolean;
  /** PayPal billing plan ID (from PayPal Developer Dashboard) */
  paypalPlanIdEnvKey?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceLabel: '$0',
    description: 'Get started with core learning features.',
    features: [
      'Dashboard & leaderboard',
      'Browse course catalog',
      'Basic skills training',
      'Community classroom access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9.99,
    priceLabel: '$9.99/mo',
    description: 'Full access to courses, AI tools, and certificates.',
    features: [
      'Everything in Free',
      'All premium courses',
      'AI classroom slides & tutor',
      'Course certificates (PDF)',
      'Priority support',
    ],
    popular: true,
    paypalPlanIdEnvKey: 'PAYPAL_PLAN_ID_PRO',
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 19.99,
    priceLabel: '$19.99/mo',
    description: 'Complete academy experience with mentorship.',
    features: [
      'Everything in Pro',
      'Startup mentorship bookings',
      'Bootcamp studio access',
      'Founder pitch deck reviews',
      'Early access to new features',
    ],
    paypalPlanIdEnvKey: 'PAYPAL_PLAN_ID_PREMIUM',
  },
];

export function getPlanById(id: SubscriptionPlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id) ?? SUBSCRIPTION_PLANS[0];
}

export function resolvePayPalPlanId(plan: SubscriptionPlan): string | null {
  if (!plan.paypalPlanIdEnvKey) return null;
  const id = process.env[plan.paypalPlanIdEnvKey];
  return id?.trim() || null;
}

export function isPaidPlan(planId: SubscriptionPlanId): boolean {
  return planId !== 'free';
}

export function getEffectivePlanId(
  subscription?: UserSubscription | null
): SubscriptionPlanId {
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }
  return subscription.planId;
}
