'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isInstructorOrAdmin } from '@/lib/admin';

export default function AdminUnauthorizedPage() {
  const { user, userProfile } = useAuth();
  const isInstructor = isInstructorOrAdmin(userProfile, user?.email);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full dashboard-panel border-midnight/10 shadow-sm">
        <CardHeader className="text-center">
          <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="font-dashboard-title text-2xl">Admin access required</CardTitle>
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
          {isInstructor ? (
            <Button asChild className="brand-button">
              <Link href="/instructor/dashboard">Go to instructor dashboard</Link>
            </Button>
          ) : (
            <Button asChild className="brand-button">
              <Link href="/dashboard">Go to learner dashboard</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/admin/login">Sign in with an admin account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
