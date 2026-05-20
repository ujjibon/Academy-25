'use client';

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
  signInWithGoogle,
  signUpWithEmail,
  setPendingSignupPath,
  consumePendingSignupRedirect,
  getSignupRedirectForPath,
  type SignupPath,
} from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

type Props = {
  signupPath: SignupPath;
};

export function SignUpForm({ signupPath }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const redirectAfter = getSignupRedirectForPath(signupPath);
  const isFounder = signupPath === 'founder';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setBusy(true);
    try {
      setPendingSignupPath(signupPath);
      await signUpWithEmail(values.email, values.password, {
        displayName: values.name,
        role: 'learner',
      });
      toast({
        title: 'Account created',
        description: isFounder
          ? 'Welcome to the startup hub.'
          : "Welcome to Peer Academy! We're glad to have you.",
      });
      router.push(consumePendingSignupRedirect());
    } catch (error: unknown) {
      setPendingSignupPath(null);
      const message = error instanceof Error ? error.message : 'Could not create account.';
      toast({ title: 'Sign-up failed', description: message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      setPendingSignupPath(signupPath);
      const result = await signInWithGoogle();
      if (!result) return;
      toast({
        title: 'Account created',
        description: 'Successfully signed up with Google.',
      });
      router.push(consumePendingSignupRedirect());
    } catch (error) {
      setPendingSignupPath(null);
      console.error('Google Sign-In Error:', error);
      toast({
        title: 'Sign up failed',
        description: 'Could not sign in with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full rounded-2xl h-11"
        onClick={handleGoogleSignIn}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" aria-hidden viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C297.1 114.5 273.5 104 248 104 177.1 104 118 163 118 234s59.1 130 130 130c58.9 0 101.4-34.4 113.4-78h-113.4v-94.2h216.5c2.9 16.2 4.5 33.3 4.5 50.8z"
            />
          </svg>
        )}
        Sign up with Google
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Alex Doe" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" autoComplete="email" {...field} />
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
                  <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full brand-button rounded-2xl h-11" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFounder ? (
              'Create founder account'
            ) : (
              'Create learner account'
            )}
          </Button>
        </form>
      </Form>
      <p className="text-center text-xs text-muted-foreground">
        After sign-up you&apos;ll go to{' '}
        <span className="font-medium text-foreground">
          {redirectAfter === '/startup' ? 'Startup hub' : 'your dashboard'}
        </span>
      </p>
    </div>
  );
}
