'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgePercent,
  Check,
  Copy,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Ticket,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getAllUsers, type UserProfile } from '@/lib/firebase';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '@/lib/subscription-types';
import type {
  Coupon,
  CouponDiscountType,
  CouponAppliesTo,
  PaymentRecord,
  PaymentStats,
  PaymentStatus,
} from '@/lib/payment-types';
import {
  adminGrantSubscription,
  createCoupon,
  createPayment,
  deleteCoupon,
  getPaymentStats,
  listCoupons,
  listPayments,
  updateCoupon,
  updatePaymentStatus,
} from '@/lib/payment-service';
import { formatCents, generateCouponCode } from '@/lib/coupon-utils';

function parseLocalInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function statusBadgeVariant(
  status: PaymentStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'refunded' || status === 'failed' || status === 'cancelled') {
    return 'destructive';
  }
  return 'outline';
}

type CouponFormState = {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  grantPlanId: SubscriptionPlanId;
  appliesTo: CouponAppliesTo;
  planFilter: 'all' | 'pro' | 'premium' | 'pro_premium';
  maxRedemptions: string;
  maxPerUser: string;
  minPurchaseDollars: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyCouponForm = (): CouponFormState => ({
  code: generateCouponCode(8),
  description: '',
  discountType: 'percent',
  discountValue: '100',
  grantPlanId: 'pro',
  appliesTo: 'subscription',
  planFilter: 'all',
  maxRedemptions: '',
  maxPerUser: '1',
  minPurchaseDollars: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
});

export function AdminBillingPanel() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);

  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<CouponFormState>(emptyCouponForm);

  const [grantUserId, setGrantUserId] = useState('');
  const [grantPlanId, setGrantPlanId] = useState<SubscriptionPlanId>('pro');
  const [grantMonths, setGrantMonths] = useState('1');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantNotes, setGrantNotes] = useState('');

  const [recordUserId, setRecordUserId] = useState('');
  const [recordType, setRecordType] = useState<'subscription' | 'course' | 'manual'>('manual');
  const [recordAmount, setRecordAmount] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [recordCourseTitle, setRecordCourseTitle] = useState('');

  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [couponSearch, setCouponSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [couponList, paymentList, userList] = await Promise.all([
        listCoupons(),
        listPayments(300),
        getAllUsers(),
      ]);
      setCoupons(couponList);
      setPayments(paymentList);
      setUsers(userList);
      setStats(await getPaymentStats(paymentList, couponList));
    } catch (err) {
      toast({
        title: 'Failed to load billing data',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filteredCoupons = useMemo(() => {
    const q = couponSearch.trim().toUpperCase();
    if (!q) return coupons;
    return coupons.filter(
      (c) =>
        c.code.includes(q) ||
        (c.description || '').toUpperCase().includes(q)
    );
  }, [coupons, couponSearch]);

  const filteredPayments = useMemo(() => {
    if (paymentFilter === 'all') return payments;
    return payments.filter((p) => p.status === paymentFilter);
  }, [payments, paymentFilter]);

  const paidSubscribers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.subscription?.status === 'active' &&
          u.subscription.planId &&
          u.subscription.planId !== 'free'
      ),
    [users]
  );

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: 'Copied', description: code });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }

  async function handleCreateCoupon() {
    if (!user) return;
    setSaving(true);
    try {
      let planIds: SubscriptionPlanId[] | undefined;
      if (couponForm.planFilter === 'pro') planIds = ['pro'];
      if (couponForm.planFilter === 'premium') planIds = ['premium'];
      if (couponForm.planFilter === 'pro_premium') planIds = ['pro', 'premium'];

      const discountValue =
        couponForm.discountType === 'plan_grant'
          ? 0
          : couponForm.discountType === 'fixed'
            ? Math.round(parseFloat(couponForm.discountValue || '0') * 100)
            : parseInt(couponForm.discountValue || '0', 10);

      await createCoupon(
        {
          code: couponForm.code,
          description: couponForm.description || undefined,
          discountType: couponForm.discountType,
          discountValue,
          grantPlanId:
            couponForm.discountType === 'plan_grant'
              ? couponForm.grantPlanId
              : couponForm.discountType === 'percent' && discountValue === 100
                ? couponForm.grantPlanId
                : undefined,
          appliesTo: couponForm.appliesTo,
          planIds,
          maxRedemptions: couponForm.maxRedemptions
            ? parseInt(couponForm.maxRedemptions, 10)
            : null,
          maxPerUser: parseInt(couponForm.maxPerUser || '1', 10),
          minPurchaseCents: couponForm.minPurchaseDollars
            ? Math.round(parseFloat(couponForm.minPurchaseDollars) * 100)
            : undefined,
          startsAt: parseLocalInput(couponForm.startsAt),
          expiresAt: parseLocalInput(couponForm.expiresAt),
          isActive: couponForm.isActive,
        },
        user.uid
      );

      toast({ title: 'Coupon created', description: couponForm.code.toUpperCase() });
      setCouponDialogOpen(false);
      setCouponForm(emptyCouponForm());
      await loadAll();
    } catch (err) {
      toast({
        title: 'Could not create coupon',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleCouponActive(coupon: Coupon) {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      toast({
        title: coupon.isActive ? 'Coupon deactivated' : 'Coupon activated',
        description: coupon.code,
      });
      await loadAll();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteCoupon(coupon: Coupon) {
    try {
      await deleteCoupon(coupon.id);
      toast({ title: 'Coupon deleted', description: coupon.code });
      await loadAll();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    }
  }

  async function handleGrant() {
    if (!user || !grantUserId) return;
    const target = users.find((u) => u.uid === grantUserId);
    if (!target) return;

    setSaving(true);
    try {
      await adminGrantSubscription({
        userId: target.uid,
        userEmail: target.email,
        userDisplayName: target.displayName,
        planId: grantPlanId,
        adminUid: user.uid,
        notes: grantNotes || undefined,
        amountCents: grantAmount
          ? Math.round(parseFloat(grantAmount) * 100)
          : 0,
        months: parseInt(grantMonths || '1', 10) || 1,
      });
      toast({
        title: 'Subscription granted',
        description: `${target.displayName} → ${grantPlanId}`,
      });
      setGrantNotes('');
      setGrantAmount('');
      await loadAll();
    } catch (err) {
      toast({
        title: 'Grant failed',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordPayment() {
    if (!user || !recordUserId) return;
    const target = users.find((u) => u.uid === recordUserId);
    if (!target) return;
    const amount = Math.round(parseFloat(recordAmount || '0') * 100);
    if (amount < 0 || Number.isNaN(amount)) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await createPayment({
        userId: target.uid,
        userEmail: target.email,
        userDisplayName: target.displayName,
        type: recordType,
        status: 'completed',
        provider: 'manual',
        amountCents: amount,
        courseTitle: recordCourseTitle || undefined,
        notes: recordNotes || undefined,
        createdBy: user.uid,
      });
      toast({ title: 'Payment recorded' });
      setRecordAmount('');
      setRecordNotes('');
      setRecordCourseTitle('');
      await loadAll();
    } catch (err) {
      toast({
        title: 'Could not record payment',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePaymentStatus(payment: PaymentRecord, status: PaymentStatus) {
    try {
      await updatePaymentStatus(payment.id, status);
      toast({ title: `Marked ${status}`, description: payment.userEmail });
      await loadAll();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-dashboard-title text-3xl font-bold tracking-tight">
            Payments & coupons
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate coupon codes, track revenue, and manage subscriptions.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadAll()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-panel border-midnight/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Revenue (completed)</CardDescription>
            <CardTitle className="text-2xl">
              {formatCents(stats?.totalRevenueCents ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.completedCount ?? 0} completed payments
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-panel border-midnight/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Paid subscribers</CardDescription>
            <CardTitle className="text-2xl">{paidSubscribers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active Pro / Premium on profiles
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-panel border-midnight/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Active coupons</CardDescription>
            <CardTitle className="text-2xl">{stats?.activeCouponCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.totalCouponRedemptions ?? 0} total redemptions
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-panel border-midnight/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Coupon grants</CardDescription>
            <CardTitle className="text-2xl">{stats?.couponGrants ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Free plan unlocks via codes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="coupons" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="coupons" className="gap-1.5">
            <Ticket className="h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="grant" className="gap-1.5">
            <BadgePercent className="h-4 w-4" />
            Grant & record
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-4">
          <Card className="dashboard-panel border-midnight/10">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Coupon codes</CardTitle>
                <CardDescription>
                  Generate promo codes for subscriptions or courses. 100% off and
                  plan-grant codes unlock plans without PayPal.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search codes…"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  className="w-44"
                />
                <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setCouponForm(emptyCouponForm())}
                      className="brand-button"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Generate coupon
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Generate coupon</DialogTitle>
                      <DialogDescription>
                        Create a unique code learners can redeem at checkout.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="grid gap-2">
                        <Label htmlFor="coupon-code">Code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="coupon-code"
                            value={couponForm.code}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                code: e.target.value.toUpperCase(),
                              }))
                            }
                            className="font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setCouponForm((f) => ({
                                ...f,
                                code: generateCouponCode(8),
                              }))
                            }
                          >
                            Regenerate
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="coupon-desc">Description</Label>
                        <Input
                          id="coupon-desc"
                          value={couponForm.description}
                          onChange={(e) =>
                            setCouponForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Launch promo"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Discount type</Label>
                          <Select
                            value={couponForm.discountType}
                            onValueChange={(v) =>
                              setCouponForm((f) => ({
                                ...f,
                                discountType: v as CouponDiscountType,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">Percent off</SelectItem>
                              <SelectItem value="fixed">Fixed amount</SelectItem>
                              <SelectItem value="plan_grant">Plan grant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {couponForm.discountType === 'plan_grant' ? (
                          <div className="grid gap-2">
                            <Label>Grant plan</Label>
                            <Select
                              value={couponForm.grantPlanId}
                              onValueChange={(v) =>
                                setCouponForm((f) => ({
                                  ...f,
                                  grantPlanId: v as SubscriptionPlanId,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            <Label>
                              {couponForm.discountType === 'percent'
                                ? 'Percent'
                                : 'Amount (USD)'}
                            </Label>
                            <Input
                              type="number"
                              min={couponForm.discountType === 'percent' ? 1 : 0.01}
                              max={couponForm.discountType === 'percent' ? 100 : undefined}
                              step={couponForm.discountType === 'percent' ? 1 : 0.01}
                              value={couponForm.discountValue}
                              onChange={(e) =>
                                setCouponForm((f) => ({
                                  ...f,
                                  discountValue: e.target.value,
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>
                      {couponForm.discountType === 'percent' &&
                      parseInt(couponForm.discountValue, 10) === 100 ? (
                        <div className="grid gap-2">
                          <Label>Plan unlocked at 100% off</Label>
                          <Select
                            value={couponForm.grantPlanId}
                            onValueChange={(v) =>
                              setCouponForm((f) => ({
                                ...f,
                                grantPlanId: v as SubscriptionPlanId,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Applies to</Label>
                          <Select
                            value={couponForm.appliesTo}
                            onValueChange={(v) =>
                              setCouponForm((f) => ({
                                ...f,
                                appliesTo: v as CouponAppliesTo,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="subscription">Subscriptions</SelectItem>
                              <SelectItem value="course">Courses</SelectItem>
                              <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Plan restriction</Label>
                          <Select
                            value={couponForm.planFilter}
                            onValueChange={(v) =>
                              setCouponForm((f) => ({
                                ...f,
                                planFilter: v as CouponFormState['planFilter'],
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any paid plan</SelectItem>
                              <SelectItem value="pro">Pro only</SelectItem>
                              <SelectItem value="premium">Premium only</SelectItem>
                              <SelectItem value="pro_premium">Pro & Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Max redemptions</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Unlimited"
                            value={couponForm.maxRedemptions}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                maxRedemptions: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Max per user</Label>
                          <Input
                            type="number"
                            min={1}
                            value={couponForm.maxPerUser}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                maxPerUser: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Min purchase (USD, optional)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={couponForm.minPurchaseDollars}
                          onChange={(e) =>
                            setCouponForm((f) => ({
                              ...f,
                              minPurchaseDollars: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Starts</Label>
                          <Input
                            type="datetime-local"
                            value={couponForm.startsAt}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                startsAt: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Expires</Label>
                          <Input
                            type="datetime-local"
                            value={couponForm.expiresAt}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                expiresAt: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <Label htmlFor="coupon-active">Active</Label>
                        <Switch
                          id="coupon-active"
                          checked={couponForm.isActive}
                          onCheckedChange={(checked) =>
                            setCouponForm((f) => ({ ...f, isActive: checked }))
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCouponDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button disabled={saving} onClick={() => void handleCreateCoupon()}>
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCoupons.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No coupons yet. Generate your first code.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Applies</TableHead>
                        <TableHead>Uses</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCoupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-sm font-semibold">
                                {coupon.code}
                              </code>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => void copyCode(coupon.code)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {coupon.description ? (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {coupon.description}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-sm">
                            {coupon.discountType === 'percent'
                              ? `${coupon.discountValue}% off`
                              : coupon.discountType === 'fixed'
                                ? `${formatCents(coupon.discountValue)} off`
                                : `Grant ${coupon.grantPlanId}`}
                          </TableCell>
                          <TableCell className="capitalize text-sm">
                            {coupon.appliesTo}
                          </TableCell>
                          <TableCell className="text-sm">
                            {coupon.redemptionCount}
                            {coupon.maxRedemptions != null
                              ? ` / ${coupon.maxRedemptions}`
                              : ''}
                          </TableCell>
                          <TableCell>
                            <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                              {coupon.isActive ? 'Active' : 'Off'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {coupon.expiresAt
                              ? coupon.expiresAt.toLocaleDateString()
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void toggleCouponActive(coupon)}
                            >
                              {coupon.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {coupon.code}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently removes the coupon. Existing
                                    redemptions stay in the ledger.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => void handleDeleteCoupon(coupon)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="dashboard-panel border-midnight/10">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Payment ledger</CardTitle>
                <CardDescription>
                  PayPal subscriptions, coupon grants, and manually recorded charges.
                </CardDescription>
              </div>
              <Select
                value={paymentFilter}
                onValueChange={(v) =>
                  setPaymentFilter(v as typeof paymentFilter)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {payment.createdAt.toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {payment.userDisplayName || '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.userEmail}
                            </div>
                            {payment.couponCode ? (
                              <Badge variant="outline" className="mt-1 font-mono text-[10px]">
                                {payment.couponCode}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-sm capitalize">
                            {payment.type.replace('_', ' ')}
                            {payment.planId ? (
                              <span className="text-muted-foreground"> · {payment.planId}</span>
                            ) : null}
                            {payment.courseTitle ? (
                              <div className="text-xs text-muted-foreground">
                                {payment.courseTitle}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-sm capitalize">
                            {payment.provider}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatCents(payment.amountCents, payment.currency)}
                            {payment.discountCents ? (
                              <div className="text-xs text-muted-foreground">
                                −{formatCents(payment.discountCents)} discount
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {payment.status === 'completed' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void handlePaymentStatus(payment, 'refunded')
                                }
                              >
                                Refund
                              </Button>
                            ) : null}
                            {payment.status === 'pending' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void handlePaymentStatus(payment, 'completed')
                                }
                              >
                                Complete
                              </Button>
                            ) : null}
                            {payment.status !== 'cancelled' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  void handlePaymentStatus(payment, 'cancelled')
                                }
                              >
                                Cancel
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grant" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="dashboard-panel border-midnight/10">
              <CardHeader>
                <CardTitle>Grant subscription</CardTitle>
                <CardDescription>
                  Manually activate a plan for a user and log it in the ledger.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>User</Label>
                  <Select value={grantUserId} onValueChange={setGrantUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.uid} value={u.uid}>
                          {u.displayName} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Plan</Label>
                    <Select
                      value={grantPlanId}
                      onValueChange={(v) => setGrantPlanId(v as SubscriptionPlanId)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBSCRIPTION_PLANS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Months</Label>
                    <Input
                      type="number"
                      min={1}
                      value={grantMonths}
                      onChange={(e) => setGrantMonths(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Amount collected (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0 for complimentary"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    placeholder="Comp for partner, support credit…"
                    rows={3}
                  />
                </div>
                <Button
                  disabled={saving || !grantUserId}
                  onClick={() => void handleGrant()}
                  className="w-full"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Grant plan
                </Button>
              </CardContent>
            </Card>

            <Card className="dashboard-panel border-midnight/10">
              <CardHeader>
                <CardTitle>Record payment</CardTitle>
                <CardDescription>
                  Log an offline or external payment without changing plan access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>User</Label>
                  <Select value={recordUserId} onValueChange={setRecordUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.uid} value={u.uid}>
                          {u.displayName} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select
                      value={recordType}
                      onValueChange={(v) =>
                        setRecordType(v as typeof recordType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Amount (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={recordAmount}
                      onChange={(e) => setRecordAmount(e.target.value)}
                    />
                  </div>
                </div>
                {recordType === 'course' ? (
                  <div className="grid gap-2">
                    <Label>Course title</Label>
                    <Input
                      value={recordCourseTitle}
                      onChange={(e) => setRecordCourseTitle(e.target.value)}
                    />
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={recordNotes}
                    onChange={(e) => setRecordNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  disabled={saving || !recordUserId}
                  variant="secondary"
                  onClick={() => void handleRecordPayment()}
                  className="w-full"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Record payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card className="dashboard-panel border-midnight/10">
            <CardHeader>
              <CardTitle>Active paid subscribers</CardTitle>
              <CardDescription>
                Users with an active Pro or Premium plan on their profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paidSubscribers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No paid subscribers yet.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PayPal</TableHead>
                        <TableHead>Period end</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidSubscribers.map((u) => (
                        <TableRow key={u.uid}>
                          <TableCell>
                            <div className="font-medium">{u.displayName}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {u.subscription?.planId}
                          </TableCell>
                          <TableCell>
                            <Badge>{u.subscription?.status}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {u.subscription?.paypalSubscriptionId
                              ? `${u.subscription.paypalSubscriptionId.slice(0, 16)}…`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.subscription?.currentPeriodEnd
                              ? u.subscription.currentPeriodEnd.toLocaleDateString()
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
