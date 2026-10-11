'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  CreditCard,
  Crown,
  Loader2,
  Sparkles,
  Ticket,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile } from '@/lib/firebase';
import {
  SUBSCRIPTION_PLANS,
  getEffectivePlanId,
  getPlanById,
  type SubscriptionPlanId,
} from '@/lib/subscription-types';
import {
  activatePayPalSubscription,
  cancelPayPalSubscription,
  consumePendingPayPalSubscription,
  createPayPalCheckout,
  storePendingPayPalSubscription,
} from '@/lib/account-api';
import {
  redeemSubscriptionCoupon,
  recordPayPalSubscriptionPayment,
  validateCouponForUser,
} from '@/lib/payment-service';
import { formatCents, planPriceCents } from '@/lib/coupon-utils';
import { cn } from '@/lib/utils';

type Props = {
  paypalReturn?: 'success' | 'cancelled' | null;
};

export function SubscriptionManager({ paypalReturn }: Props) {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponHint, setCouponHint] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [redeemingCoupon, setRedeemingCoupon] = useState(false);

  const subscription = userProfile?.subscription;
  const currentPlanId = getEffectivePlanId(subscription);
  const currentPlan = getPlanById(currentPlanId);

  useEffect(() => {
    if (paypalReturn !== 'success' || !user || !userProfile) return;

    const pending = consumePendingPayPalSubscription();
    if (!pending) return;

    void (async () => {
      setBusyPlan(pending.planId);
      try {
        const activated = await activatePayPalSubscription(
          pending.subscriptionId,
          pending.planId
        );
        await updateUserProfile(user.uid, { subscription: activated });
        try {
          await recordPayPalSubscriptionPayment({
            userId: user.uid,
            userEmail: userProfile.email || user.email || '',
            userDisplayName: userProfile.displayName,
            planId: pending.planId,
            paypalSubscriptionId: pending.subscriptionId,
          });
        } catch (ledgerErr) {
          console.warn('Payment ledger write failed:', ledgerErr);
        }
        await refreshProfile();
        toast({
          title: 'Subscription active',
          description: `You are now on the ${getPlanById(pending.planId).name} plan.`,
        });
      } catch (err) {
        toast({
          title: 'Activation failed',
          description: err instanceof Error ? err.message : 'Could not activate subscription',
          variant: 'destructive',
        });
      } finally {
        setBusyPlan(null);
      }
    })();
  }, [paypalReturn, user, userProfile, refreshProfile, toast]);

  useEffect(() => {
    if (paypalReturn === 'cancelled') {
      consumePendingPayPalSubscription();
      toast({
        title: 'Checkout cancelled',
        description: 'You can subscribe anytime from this page.',
      });
    }
  }, [paypalReturn, toast]);

  async function handleValidateCoupon() {
    if (!user || !couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponHint(null);
    try {
      const result = await validateCouponForUser(couponCode, {
        userId: user.uid,
        amountCents: planPriceCents('pro'),
        appliesTo: 'subscription',
        planId: 'pro',
      });
      if (!result.valid) {
        setCouponHint(result.error);
        return;
      }
      if (result.grantsFreeAccess) {
        setCouponHint(
          `Valid — unlocks ${result.grantPlanId === 'premium' ? 'Premium' : 'Pro'} at no charge (${formatCents(result.discountCents)} value).`
        );
      } else {
        setCouponHint(
          `Valid — saves ${formatCents(result.discountCents)}. Full free unlock requires 100% off or a plan-grant code.`
        );
      }
    } catch (err) {
      setCouponHint(err instanceof Error ? err.message : 'Could not validate');
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleRedeemCoupon(planId: SubscriptionPlanId) {
    if (!user || !userProfile || !couponCode.trim()) {
      toast({
        title: 'Enter a coupon',
        description: 'Add a coupon code above, then redeem.',
        variant: 'destructive',
      });
      return;
    }

    setRedeemingCoupon(true);
    setBusyPlan(planId);
    try {
      const result = await redeemSubscriptionCoupon({
        code: couponCode,
        userId: user.uid,
        userEmail: userProfile.email || user.email || '',
        userDisplayName: userProfile.displayName,
        planId,
      });
      await refreshProfile();
      setCouponCode('');
      setCouponHint(null);
      toast({
        title: 'Coupon applied',
        description: result.message,
      });
    } catch (err) {
      toast({
        title: 'Coupon not applied',
        description: err instanceof Error ? err.message : 'Could not redeem',
        variant: 'destructive',
      });
    } finally {
      setRedeemingCoupon(false);
      setBusyPlan(null);
    }
  }

  async function handleSubscribe(planId: SubscriptionPlanId) {
    if (!user) return;
    if (planId === 'free') {
      await updateUserProfile(user.uid, {
        subscription: {
          planId: 'free',
          status: 'active',
          updatedAt: new Date(),
        },
      });
      await refreshProfile();
      toast({ title: 'Free plan', description: 'You are on the Free plan.' });
      return;
    }

    if (couponCode.trim()) {
      await handleRedeemCoupon(planId);
      return;
    }

    setBusyPlan(planId);
    try {
      const { subscriptionId, approvalUrl } = await createPayPalCheckout(planId);
      storePendingPayPalSubscription(subscriptionId, planId);
      window.location.href = approvalUrl;
    } catch (err) {
      toast({
        title: 'Checkout unavailable',
        description: err instanceof Error ? err.message : 'PayPal is not configured',
        variant: 'destructive',
      });
      setBusyPlan(null);
    }
  }

  async function handleCancel() {
    const subId = subscription?.paypalSubscriptionId;
    if (!user || !subId) return;

    setCancelling(true);
    try {
      const updates = await cancelPayPalSubscription(subId);
      await updateUserProfile(user.uid, {
        subscription: {
          ...subscription,
          ...updates,
          planId: 'free',
        },
      });
      await refreshProfile();
      toast({
        title: 'Subscription cancelled',
        description: 'Your PayPal subscription has been cancelled.',
      });
    } catch (err) {
      toast({
        title: 'Cancel failed',
        description: err instanceof Error ? err.message : 'Could not cancel',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  }

  async function handleDowngradeToFree() {
    if (!user) return;
    setBusyPlan('free');
    try {
      await updateUserProfile(user.uid, {
        subscription: {
          planId: 'free',
          status: 'active',
          updatedAt: new Date(),
        },
      });
      await refreshProfile();
      toast({ title: 'Plan updated', description: 'You are on the Free plan.' });
    } finally {
      setBusyPlan(null);
    }
  }

  const hasActivePayPal =
    subscription?.status === 'active' && subscription.paypalSubscriptionId;

  return (
    <div className="space-y-6">
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current plan
          </CardTitle>
          <CardDescription>Manage your subscription and payment via PayPal.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{currentPlan.name}</span>
              {currentPlan.popular && currentPlanId !== 'free' ? (
                <Badge>Active</Badge>
              ) : null}
              {subscription?.status === 'pending' ? (
                <Badge variant="secondary">Pending approval</Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1">{currentPlan.priceLabel}</p>
            {subscription?.currentPeriodEnd && subscription.status === 'active' ? (
              <p className="text-sm text-muted-foreground mt-2">
                Renews{' '}
                {subscription.currentPeriodEnd.toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
              </p>
            ) : null}
            {subscription?.paypalSubscriptionId ? (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                PayPal ID: {subscription.paypalSubscriptionId.slice(0, 20)}…
              </p>
            ) : null}
          </div>
          {hasActivePayPal ? (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-destructive hover:text-destructive"
            >
              {cancelling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Cancel subscription
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>PayPal payment gateway</AlertTitle>
        <AlertDescription>
          Paid plans use PayPal Subscriptions. Add your PayPal REST credentials and billing plan
          IDs to <code className="text-xs">.env.local</code> (see ENVIRONMENT_SETUP.md). Checkout
          opens on PayPal; you return here when done.
        </AlertDescription>
      </Alert>

      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5" />
            Coupon code
          </CardTitle>
          <CardDescription>
            Have a promo code? Enter it here, then choose a plan. Full-cover codes unlock Pro or
            Premium without PayPal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="sub-coupon" className="sr-only">
                Coupon code
              </Label>
              <Input
                id="sub-coupon"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponHint(null);
                }}
                placeholder="ENTER CODE"
                className="font-mono uppercase"
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={validatingCoupon || !couponCode.trim()}
              onClick={() => void handleValidateCoupon()}
            >
              {validatingCoupon ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Check code
            </Button>
          </div>
          {couponHint ? (
            <p className="text-sm text-muted-foreground">{couponHint}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const isPaid = plan.id !== 'free';
          const useCoupon = Boolean(couponCode.trim()) && isPaid;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-primary shadow-md',
                isCurrent && 'ring-2 ring-primary'
              )}
            >
              {plan.popular ? (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Most popular</Badge>
              ) : null}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.id === 'premium' ? (
                    <Crown className="h-5 w-5 text-amber-500" />
                  ) : null}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="text-3xl font-bold pt-2">{plan.priceLabel}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button className="w-full" variant="secondary" disabled>
                    Current plan
                  </Button>
                ) : isPaid ? (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={busyPlan !== null || redeemingCoupon}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {busyPlan === plan.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : useCoupon ? (
                      <Ticket className="mr-2 h-4 w-4" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    {useCoupon ? 'Redeem coupon' : 'Subscribe with PayPal'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={busyPlan !== null}
                    onClick={handleDowngradeToFree}
                  >
                    {busyPlan === 'free' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Switch to Free
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
