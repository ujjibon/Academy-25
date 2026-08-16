'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubscriptionPlanId } from '@/lib/subscription-types';
import type {
  Coupon,
  CouponRedemption,
  CreateCouponInput,
  CreatePaymentInput,
  PaymentRecord,
  PaymentStats,
  PaymentStatus,
  UpdateCouponInput,
  CouponValidationResult,
} from '@/lib/payment-types';
import {
  assertCreateCouponInput,
  generateCouponCode,
  normalizeCouponCode,
  planPriceCents,
  validateCouponAgainstPurchase,
} from '@/lib/coupon-utils';
import { updateUserProfile } from '@/lib/firebase';

const COUPONS = 'coupons';
const PAYMENTS = 'payments';
const REDEMPTIONS = 'couponRedemptions';

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function toDateOrNull(value: unknown): Date | null | undefined {
  if (value === null) return null;
  return toDate(value);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function mapCoupon(id: string, data: DocumentData): Coupon {
  return {
    id,
    code: String(data.code || ''),
    description: data.description ? String(data.description) : undefined,
    discountType: data.discountType,
    discountValue: Number(data.discountValue || 0),
    grantPlanId: data.grantPlanId,
    appliesTo: data.appliesTo || 'all',
    planIds: Array.isArray(data.planIds) ? data.planIds : undefined,
    maxRedemptions:
      data.maxRedemptions === null || data.maxRedemptions === undefined
        ? data.maxRedemptions ?? null
        : Number(data.maxRedemptions),
    redemptionCount: Number(data.redemptionCount || 0),
    maxPerUser: Number(data.maxPerUser || 1),
    minPurchaseCents:
      data.minPurchaseCents != null ? Number(data.minPurchaseCents) : undefined,
    startsAt: toDateOrNull(data.startsAt) ?? null,
    expiresAt: toDateOrNull(data.expiresAt) ?? null,
    isActive: data.isActive !== false,
    createdBy: String(data.createdBy || ''),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  };
}

function mapPayment(id: string, data: DocumentData): PaymentRecord {
  return {
    id,
    userId: String(data.userId || ''),
    userEmail: String(data.userEmail || ''),
    userDisplayName: data.userDisplayName
      ? String(data.userDisplayName)
      : undefined,
    type: data.type,
    status: data.status,
    provider: data.provider,
    amountCents: Number(data.amountCents || 0),
    currency: String(data.currency || 'USD'),
    originalAmountCents:
      data.originalAmountCents != null
        ? Number(data.originalAmountCents)
        : undefined,
    discountCents:
      data.discountCents != null ? Number(data.discountCents) : undefined,
    couponId: data.couponId ? String(data.couponId) : undefined,
    couponCode: data.couponCode ? String(data.couponCode) : undefined,
    planId: data.planId,
    courseId: data.courseId ? String(data.courseId) : undefined,
    courseTitle: data.courseTitle ? String(data.courseTitle) : undefined,
    paypalSubscriptionId: data.paypalSubscriptionId
      ? String(data.paypalSubscriptionId)
      : undefined,
    paypalOrderId: data.paypalOrderId ? String(data.paypalOrderId) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  };
}

function mapRedemption(id: string, data: DocumentData): CouponRedemption {
  return {
    id,
    couponId: String(data.couponId || ''),
    couponCode: String(data.couponCode || ''),
    userId: String(data.userId || ''),
    userEmail: String(data.userEmail || ''),
    paymentId: data.paymentId ? String(data.paymentId) : undefined,
    planId: data.planId,
    discountCents: Number(data.discountCents || 0),
    createdAt: toDate(data.createdAt) ?? new Date(),
  };
}

export async function listCoupons(): Promise<Coupon[]> {
  const snap = await getDocs(
    query(collection(db, COUPONS), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => mapCoupon(d.id, d.data()));
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const snap = await getDoc(doc(db, COUPONS, id));
  if (!snap.exists()) return null;
  return mapCoupon(snap.id, snap.data());
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  // Document ID is the normalized code (prevents listing all coupons as a learner)
  const snap = await getDoc(doc(db, COUPONS, normalized));
  if (!snap.exists()) return null;
  return mapCoupon(snap.id, snap.data());
}

export async function createCoupon(
  input: CreateCouponInput,
  createdBy: string
): Promise<Coupon> {
  const err = assertCreateCouponInput(input);
  if (err) throw new Error(err);

  let code = input.code
    ? normalizeCouponCode(input.code)
    : generateCouponCode(8);

  let existing = await getCouponByCode(code);
  if (existing) {
    if (input.code) throw new Error('A coupon with this code already exists.');
    code = generateCouponCode(10);
    existing = await getCouponByCode(code);
    if (existing) throw new Error('Could not generate a unique code. Try again.');
  }

  const now = new Date();
  const payload = stripUndefined({
    code,
    description: input.description?.trim() || null,
    discountType: input.discountType,
    discountValue:
      input.discountType === 'plan_grant' ? 0 : Number(input.discountValue),
    grantPlanId: input.grantPlanId || null,
    appliesTo: input.appliesTo,
    planIds: input.planIds?.length ? input.planIds : null,
    maxRedemptions:
      input.maxRedemptions === undefined ? null : input.maxRedemptions,
    redemptionCount: 0,
    maxPerUser: input.maxPerUser ?? 1,
    minPurchaseCents: input.minPurchaseCents ?? null,
    startsAt: input.startsAt ?? null,
    expiresAt: input.expiresAt ?? null,
    isActive: input.isActive !== false,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(doc(db, COUPONS, code), payload);
  return mapCoupon(code, { ...payload, createdAt: now, updatedAt: now });
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (input.code !== undefined) {
    throw new Error('Coupon codes cannot be renamed. Create a new code instead.');
  }

  if (input.description !== undefined) updates.description = input.description;
  if (input.discountType !== undefined) updates.discountType = input.discountType;
  if (input.discountValue !== undefined) updates.discountValue = input.discountValue;
  if (input.grantPlanId !== undefined) updates.grantPlanId = input.grantPlanId;
  if (input.appliesTo !== undefined) updates.appliesTo = input.appliesTo;
  if (input.planIds !== undefined) updates.planIds = input.planIds;
  if (input.maxRedemptions !== undefined) updates.maxRedemptions = input.maxRedemptions;
  if (input.maxPerUser !== undefined) updates.maxPerUser = input.maxPerUser;
  if (input.minPurchaseCents !== undefined) {
    updates.minPurchaseCents = input.minPurchaseCents;
  }
  if (input.startsAt !== undefined) updates.startsAt = input.startsAt;
  if (input.expiresAt !== undefined) updates.expiresAt = input.expiresAt;
  if (input.isActive !== undefined) updates.isActive = input.isActive;

  await updateDoc(doc(db, COUPONS, id), stripUndefined(updates));
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COUPONS, id));
}

export async function countUserCouponRedemptions(
  couponId: string,
  userId: string
): Promise<number> {
  const snap = await getDocs(
    query(collection(db, REDEMPTIONS), where('couponId', '==', couponId))
  );
  return snap.docs.filter((d) => d.data().userId === userId).length;
}

export async function validateCouponForUser(
  code: string,
  opts: {
    userId: string;
    amountCents: number;
    appliesTo: 'subscription' | 'course';
    planId?: SubscriptionPlanId;
  }
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, error: 'Coupon code not found.' };
  }

  const userCount = await countUserCouponRedemptions(coupon.id, opts.userId);
  return validateCouponAgainstPurchase(coupon, {
    ...opts,
    userRedemptionCount: userCount,
  });
}

export async function recordCouponRedemption(input: {
  couponId: string;
  couponCode: string;
  userId: string;
  userEmail: string;
  paymentId?: string;
  planId?: SubscriptionPlanId;
  discountCents: number;
}): Promise<string> {
  const ref = await addDoc(
    collection(db, REDEMPTIONS),
    stripUndefined({
      ...input,
      createdAt: new Date(),
    })
  );

  const couponRef = doc(db, COUPONS, input.couponId);
  const snap = await getDoc(couponRef);
  if (snap.exists()) {
    const current = Number(snap.data().redemptionCount || 0);
    await updateDoc(couponRef, {
      redemptionCount: current + 1,
      updatedAt: new Date(),
    });
  }

  return ref.id;
}

export async function listCouponRedemptions(
  couponId?: string,
  max = 100
): Promise<CouponRedemption[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(max)];
  if (couponId) {
    constraints.unshift(where('couponId', '==', couponId));
  }
  const snap = await getDocs(query(collection(db, REDEMPTIONS), ...constraints));
  return snap.docs.map((d) => mapRedemption(d.id, d.data()));
}

export async function listPayments(max = 200): Promise<PaymentRecord[]> {
  const snap = await getDocs(
    query(collection(db, PAYMENTS), orderBy('createdAt', 'desc'), limit(max))
  );
  return snap.docs.map((d) => mapPayment(d.id, d.data()));
}

export async function listPaymentsForUser(
  userId: string,
  max = 50
): Promise<PaymentRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, PAYMENTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(max)
    )
  );
  return snap.docs.map((d) => mapPayment(d.id, d.data()));
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<PaymentRecord> {
  const now = new Date();
  const payload = stripUndefined({
    userId: input.userId,
    userEmail: input.userEmail,
    userDisplayName: input.userDisplayName || null,
    type: input.type,
    status: input.status ?? 'completed',
    provider: input.provider,
    amountCents: Math.max(0, Math.round(input.amountCents)),
    currency: input.currency || 'USD',
    originalAmountCents: input.originalAmountCents ?? null,
    discountCents: input.discountCents ?? null,
    couponId: input.couponId || null,
    couponCode: input.couponCode || null,
    planId: input.planId || null,
    courseId: input.courseId || null,
    courseTitle: input.courseTitle || null,
    paypalSubscriptionId: input.paypalSubscriptionId || null,
    paypalOrderId: input.paypalOrderId || null,
    notes: input.notes || null,
    createdBy: input.createdBy || null,
    createdAt: now,
    updatedAt: now,
  });

  const ref = await addDoc(collection(db, PAYMENTS), payload);
  return mapPayment(ref.id, { ...payload, createdAt: now, updatedAt: now });
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  notes?: string
): Promise<void> {
  await updateDoc(
    doc(db, PAYMENTS, id),
    stripUndefined({
      status,
      notes: notes || undefined,
      updatedAt: new Date(),
    })
  );
}

export async function getPaymentStats(
  payments?: PaymentRecord[],
  coupons?: Coupon[]
): Promise<PaymentStats> {
  const [paymentList, couponList] = await Promise.all([
    payments ? Promise.resolve(payments) : listPayments(500),
    coupons ? Promise.resolve(coupons) : listCoupons(),
  ]);

  let totalRevenueCents = 0;
  let completedCount = 0;
  let refundedCount = 0;
  let pendingCount = 0;
  let subscriptionPayments = 0;
  let coursePayments = 0;
  let couponGrants = 0;

  for (const p of paymentList) {
    if (p.status === 'completed') {
      completedCount += 1;
      totalRevenueCents += p.amountCents;
    } else if (p.status === 'refunded') {
      refundedCount += 1;
    } else if (p.status === 'pending') {
      pendingCount += 1;
    }

    if (p.type === 'subscription') subscriptionPayments += 1;
    if (p.type === 'course' || p.type === 'bundle') coursePayments += 1;
    if (p.type === 'coupon_grant') couponGrants += 1;
  }

  return {
    totalRevenueCents,
    completedCount,
    refundedCount,
    pendingCount,
    activeCouponCount: couponList.filter((c) => c.isActive).length,
    totalCouponRedemptions: couponList.reduce(
      (sum, c) => sum + (c.redemptionCount || 0),
      0
    ),
    subscriptionPayments,
    coursePayments,
    couponGrants,
  };
}

/** Redeem a coupon for a subscription — grants plan access when free / plan_grant. */
export async function redeemSubscriptionCoupon(opts: {
  code: string;
  userId: string;
  userEmail: string;
  userDisplayName?: string;
  planId: SubscriptionPlanId;
}): Promise<{
  payment: PaymentRecord;
  grantPlanId: SubscriptionPlanId;
  message: string;
}> {
  if (opts.planId === 'free') {
    throw new Error('Select a paid plan to redeem this coupon.');
  }

  const amountCents = planPriceCents(opts.planId);
  const validation = await validateCouponForUser(opts.code, {
    userId: opts.userId,
    amountCents,
    appliesTo: 'subscription',
    planId: opts.planId,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!validation.grantsFreeAccess || !validation.grantPlanId) {
    throw new Error(
      'This coupon does not fully cover the plan. PayPal plans use fixed pricing — use a 100% off or plan-grant coupon, or subscribe normally.'
    );
  }

  const grantPlanId = validation.grantPlanId;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await updateUserProfile(opts.userId, {
    subscription: {
      planId: grantPlanId,
      status: 'active',
      cancelAtPeriodEnd: false,
      startedAt: now,
      updatedAt: now,
      currentPeriodEnd: periodEnd,
    },
  });

  const payment = await createPayment({
    userId: opts.userId,
    userEmail: opts.userEmail,
    userDisplayName: opts.userDisplayName,
    type: 'coupon_grant',
    status: 'completed',
    provider: 'coupon',
    amountCents: 0,
    originalAmountCents: amountCents,
    discountCents: validation.discountCents,
    couponId: validation.coupon.id,
    couponCode: validation.coupon.code,
    planId: grantPlanId,
    notes: `Coupon ${validation.coupon.code} granted ${grantPlanId}`,
  });

  await recordCouponRedemption({
    couponId: validation.coupon.id,
    couponCode: validation.coupon.code,
    userId: opts.userId,
    userEmail: opts.userEmail,
    paymentId: payment.id,
    planId: grantPlanId,
    discountCents: validation.discountCents,
  });

  return {
    payment,
    grantPlanId,
    message: `${grantPlanId === 'premium' ? 'Premium' : 'Pro'} plan activated with coupon ${validation.coupon.code}.`,
  };
}

/** Admin: manually grant a subscription plan and log a payment. */
export async function adminGrantSubscription(opts: {
  userId: string;
  userEmail: string;
  userDisplayName?: string;
  planId: SubscriptionPlanId;
  adminUid: string;
  notes?: string;
  amountCents?: number;
  months?: number;
}): Promise<PaymentRecord> {
  const now = new Date();
  const months = opts.months ?? 1;
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  await updateUserProfile(opts.userId, {
    subscription: {
      planId: opts.planId,
      status: 'active',
      cancelAtPeriodEnd: false,
      startedAt: now,
      updatedAt: now,
      currentPeriodEnd: opts.planId === 'free' ? undefined : periodEnd,
    },
  });

  return createPayment({
    userId: opts.userId,
    userEmail: opts.userEmail,
    userDisplayName: opts.userDisplayName,
    type: 'manual',
    status: 'completed',
    provider: 'manual',
    amountCents: opts.amountCents ?? 0,
    originalAmountCents: opts.planId === 'free' ? 0 : planPriceCents(opts.planId),
    planId: opts.planId,
    notes: opts.notes || `Manual ${opts.planId} grant by admin`,
    createdBy: opts.adminUid,
  });
}

export async function recordPayPalSubscriptionPayment(opts: {
  userId: string;
  userEmail: string;
  userDisplayName?: string;
  planId: SubscriptionPlanId;
  paypalSubscriptionId: string;
  couponCode?: string;
  couponId?: string;
  discountCents?: number;
}): Promise<PaymentRecord> {
  const original = planPriceCents(opts.planId);
  const discount = opts.discountCents ?? 0;
  return createPayment({
    userId: opts.userId,
    userEmail: opts.userEmail,
    userDisplayName: opts.userDisplayName,
    type: 'subscription',
    status: 'completed',
    provider: 'paypal',
    amountCents: Math.max(0, original - discount),
    originalAmountCents: original,
    discountCents: discount || undefined,
    couponId: opts.couponId,
    couponCode: opts.couponCode,
    planId: opts.planId,
    paypalSubscriptionId: opts.paypalSubscriptionId,
  });
}
