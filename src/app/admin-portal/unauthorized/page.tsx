'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function AdminUnauthorizedPage() {
  const { user, userProfile } = useAuth();

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-2" />
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            {user
              ? `Signed in as ${userProfile?.email || user.email}, but this account does not have administrator privileges.`
              : 'Please sign in with an admin account to access the portal.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground text-center">
            Ask an existing admin to promote your account, or add your email to{' '}
            <code className="text-xs bg-muted px-1 rounded">ADMIN_EMAILS</code> in{' '}
            <code className="text-xs bg-muted px-1 rounded">.env.local</code> and sign in again.
          </p>
          <Button asChild variant="default">
            <Link href="/dashboard">Go to learner dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login?redirect=/admin-portal">Sign in with another account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
