'use client';

import { Suspense, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  auth,
  getUserProfile,
  signInWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
} from '@/lib/firebase';
import { resolveAdminLoginEmail, verifyAdminAccess } from '@/lib/admin';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(6, { message: 'Password is required.' }),
});

const ADMIN_DESTINATION = '/admin-portal';

async function ensureAdminOrSignOut(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const allowed = await verifyAdminAccess(getUserProfile, user.uid, user.email);
  if (!allowed) {
    await firebaseSignOut();
    return false;
  }
  return true;
}

function AdminLoginFormInner() {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: 'admin', password: '' },
  });

  async function rejectNonAdmin() {
    toast({
      title: 'Access denied',
      description:
        'This account is not an administrator. Use a learner account at the main sign-in page.',
      variant: 'destructive',
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setBusy(true);
    try {
      const email = resolveAdminLoginEmail(values.username);
      await signInWithEmail(email, values.password);
      const ok = await ensureAdminOrSignOut();
      if (!ok) {
        await rejectNonAdmin();
        return;
      }
      toast({
        title: 'Admin sign-in successful',
        description: 'Welcome to the admin portal.',
      });
      router.push(ADMIN_DESTINATION);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid email or password.';
      toast({
        title: 'Sign-in failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return;

      const ok = await ensureAdminOrSignOut();
      if (!ok) {
        await rejectNonAdmin();
        return;
      }
      toast({
        title: 'Admin sign-in successful',
        description: 'Welcome to the admin portal.',
      });
      router.push(ADMIN_DESTINATION);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not sign in with Google.';
      toast({
        title: 'Sign-in failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground text-center rounded-lg bg-secondary/60 px-3 py-2">
        Only accounts listed in <code className="text-[0.65rem]">ADMIN_EMAILS</code> or promoted
        to admin in Firestore can sign in here.
      </p>

      <Button
        variant="outline"
        className="w-full rounded-2xl"
        onClick={handleGoogleSignIn}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden
            viewBox="0 0 488 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C297.1 114.5 273.5 104 248 104 177.1 104 118 163 118 234s59.1 130 130 130c58.9 0 101.4-34.4 113.4-78h-113.4v-94.2h216.5c2.9 16.2 4.5 33.3 4.5 50.8z"
            />
          </svg>
        )}
        Sign in with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or email</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="admin" autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full brand-button" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in to admin'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export function AdminLoginForm() {
  return (
    <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-md" />}>
      <AdminLoginFormInner />
    </Suspense>
  );
}

