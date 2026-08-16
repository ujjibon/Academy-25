import type { SubscriptionPlanId } from '@/lib/subscription-types';

export type CouponDiscountType = 'percent' | 'fixed' | 'plan_grant';

export type CouponAppliesTo = 'subscription' | 'course' | 'all';

export type PaymentType =
  | 'subscription'
  | 'course'
  | 'bundle'
  | 'manual'
  | 'coupon_grant';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'refunded'
  | 'cancelled'
  | 'failed';

export type PaymentProvider = 'paypal' | 'coupon' | 'manual' | 'other';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  /** Percent 1–100, fixed amount in cents, or 0 for plan_grant */
  discountValue: number;
  /** Plan unlocked by plan_grant or 100% off subscription coupons */
  grantPlanId?: SubscriptionPlanId;
  appliesTo: CouponAppliesTo;
  /** If set, coupon only applies to these subscription plans */
  planIds?: SubscriptionPlanId[];
  maxRedemptions?: number | null;
  redemptionCount: number;
  maxPerUser: number;
  minPurchaseCents?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  couponCode: string;
  userId: string;
  userEmail: string;
  paymentId?: string;
  planId?: SubscriptionPlanId;
  discountCents: number;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName?: string;
  type: PaymentType;
  status: PaymentStatus;
  provider: PaymentProvider;
  amountCents: number;
  currency: string;
  originalAmountCents?: number;
  discountCents?: number;
  couponId?: string;
  couponCode?: string;
  planId?: SubscriptionPlanId;
  courseId?: string;
  courseTitle?: string;
  paypalSubscriptionId?: string;
  paypalOrderId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCouponInput = {
  code?: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  grantPlanId?: SubscriptionPlanId;
  appliesTo: CouponAppliesTo;
  planIds?: SubscriptionPlanId[];
  maxRedemptions?: number | null;
  maxPerUser?: number;
  minPurchaseCents?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive?: boolean;
};

export type UpdateCouponInput = Partial<
  Omit<Coupon, 'id' | 'code' | 'createdBy' | 'createdAt' | 'redemptionCount'>
> & {
  code?: string;
};

export type CreatePaymentInput = {
  userId: string;
  userEmail: string;
  userDisplayName?: string;
  type: PaymentType;
  status?: PaymentStatus;
  provider: PaymentProvider;
  amountCents: number;
  currency?: string;
  originalAmountCents?: number;
  discountCents?: number;
  couponId?: string;
  couponCode?: string;
  planId?: SubscriptionPlanId;
  courseId?: string;
  courseTitle?: string;
  paypalSubscriptionId?: string;
  paypalOrderId?: string;
  notes?: string;
  createdBy?: string;
};

export type CouponValidationResult =
  | {
      valid: true;
      coupon: Coupon;
      discountCents: number;
      finalAmountCents: number;
      grantsFreeAccess: boolean;
      grantPlanId?: SubscriptionPlanId;
    }
  | { valid: false; error: string };

export type PaymentStats = {
  totalRevenueCents: number;
  completedCount: number;
  refundedCount: number;
  pendingCount: number;
  activeCouponCount: number;
  totalCouponRedemptions: number;
  subscriptionPayments: number;
  coursePayments: number;
  couponGrants: number;
};
