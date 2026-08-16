import type { SubscriptionPlanId } from '@/lib/subscription-types';
import { getPlanById } from '@/lib/subscription-types';
import type {
  Coupon,
  CouponValidationResult,
  CreateCouponInput,
} from '@/lib/payment-types';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function generateCouponCode(length = 8): string {
  const size = Math.min(16, Math.max(4, length));
  let out = '';
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(size);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < size; i++) {
      out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
    }
    return out;
  }
  for (let i = 0; i < size; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function planPriceCents(planId: SubscriptionPlanId): number {
  const plan = getPlanById(planId);
  return Math.round(plan.priceMonthly * 100);
}

export function computeDiscountCents(
  coupon: Pick<Coupon, 'discountType' | 'discountValue'>,
  amountCents: number
): number {
  if (amountCents <= 0) return 0;
  if (coupon.discountType === 'plan_grant') return amountCents;
  if (coupon.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, coupon.discountValue));
    return Math.min(amountCents, Math.round((amountCents * pct) / 100));
  }
  return Math.min(amountCents, Math.max(0, Math.round(coupon.discountValue)));
}

export function validateCouponAgainstPurchase(
  coupon: Coupon,
  opts: {
    amountCents: number;
    appliesTo: 'subscription' | 'course';
    planId?: SubscriptionPlanId;
    userRedemptionCount?: number;
    now?: Date;
  }
): CouponValidationResult {
  const now = opts.now ?? new Date();

  if (!coupon.isActive) {
    return { valid: false, error: 'This coupon is no longer active.' };
  }

  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, error: 'This coupon is not valid yet.' };
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { valid: false, error: 'This coupon has expired.' };
  }

  if (
    coupon.maxRedemptions != null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    return { valid: false, error: 'This coupon has reached its redemption limit.' };
  }

  const perUser = coupon.maxPerUser ?? 1;
  if ((opts.userRedemptionCount ?? 0) >= perUser) {
    return { valid: false, error: 'You have already used this coupon.' };
  }

  if (coupon.appliesTo !== 'all' && coupon.appliesTo !== opts.appliesTo) {
    return {
      valid: false,
      error:
        coupon.appliesTo === 'subscription'
          ? 'This coupon only applies to subscriptions.'
          : 'This coupon only applies to course purchases.',
    };
  }

  if (
    opts.appliesTo === 'subscription' &&
    coupon.planIds?.length &&
    opts.planId &&
    !coupon.planIds.includes(opts.planId)
  ) {
    return { valid: false, error: 'This coupon does not apply to the selected plan.' };
  }

  if (
    coupon.minPurchaseCents != null &&
    opts.amountCents < coupon.minPurchaseCents
  ) {
    return {
      valid: false,
      error: `Minimum purchase of ${formatCents(coupon.minPurchaseCents)} required.`,
    };
  }

  const discountCents = computeDiscountCents(coupon, opts.amountCents);
  const finalAmountCents = Math.max(0, opts.amountCents - discountCents);
  const grantsFreeAccess =
    coupon.discountType === 'plan_grant' || finalAmountCents === 0;

  let grantPlanId = coupon.grantPlanId;
  if (grantsFreeAccess && !grantPlanId && opts.planId && opts.planId !== 'free') {
    grantPlanId = opts.planId;
  }

  if (coupon.discountType === 'plan_grant' && !grantPlanId) {
    return { valid: false, error: 'This coupon is misconfigured (missing plan).' };
  }

  return {
    valid: true,
    coupon,
    discountCents,
    finalAmountCents,
    grantsFreeAccess,
    grantPlanId,
  };
}

export function assertCreateCouponInput(input: CreateCouponInput): string | null {
  const code = input.code ? normalizeCouponCode(input.code) : null;
  if (code !== null && !/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return 'Code must be 3–32 characters (letters, numbers, _ or -).';
  }

  if (input.discountType === 'percent') {
    if (input.discountValue < 1 || input.discountValue > 100) {
      return 'Percent discount must be between 1 and 100.';
    }
  } else if (input.discountType === 'fixed') {
    if (input.discountValue < 1) {
      return 'Fixed discount must be at least 1 cent.';
    }
  } else if (input.discountType === 'plan_grant') {
    if (!input.grantPlanId || input.grantPlanId === 'free') {
      return 'Plan grant coupons require Pro or Premium.';
    }
  }

  if (input.maxPerUser != null && input.maxPerUser < 1) {
    return 'Max per user must be at least 1.';
  }

  if (input.maxRedemptions != null && input.maxRedemptions < 1) {
    return 'Max redemptions must be at least 1.';
  }

  return null;
}
