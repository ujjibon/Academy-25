'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Settings, User } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { AccountProfileForm } from '@/components/account/AccountProfileForm';
import { SubscriptionManager } from '@/components/account/SubscriptionManager';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getEffectivePlanId, getPlanById } from '@/lib/subscription-types';

function AccountPageContent() {
  const searchParams = useSearchParams();
  const { userProfile, loading } = useAuth();

  const tab = searchParams.get('tab') === 'subscription' ? 'subscription' : 'profile';
  const paypalReturn = searchParams.get('paypal') as 'success' | 'cancelled' | null;

  const planBadge = useMemo(() => {
    if (!userProfile) return null;
    const plan = getPlanById(getEffectivePlanId(userProfile.subscription));
    return plan.name;
  }, [userProfile]);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!userProfile) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
            <p className="text-muted-foreground mb-4">
              Log in to manage your profile and subscription.
            </p>
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Account
            </h1>
            <p className="text-muted-foreground mt-1">
              Edit your profile, photo, and details · Manage subscription & PayPal billing
            </p>
          </div>
          {planBadge ? (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {planBadge} plan
            </Badge>
          ) : null}
        </div>

        <Tabs defaultValue={tab} key={tab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              Subscription
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <AccountProfileForm userProfile={userProfile} />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              <Link href="/profile" className="underline hover:text-foreground">
                View public profile
              </Link>{' '}
              (badges & certificates)
            </p>
          </TabsContent>
          <TabsContent value="subscription" className="mt-6">
            <SubscriptionManager paypalReturn={paypalReturn} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AppLayout>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
