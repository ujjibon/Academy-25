'use client';

import { useState } from 'react';
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
} from '@/lib/firebase';
import { ArrowRight, Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C297.1 114.5 273.5 104 248 104 177.1 104 118 163 118 234s59.1 130 130 130c58.9 0 101.4-34.4 113.4-78h-113.4v-94.2h216.5c2.9 16.2 4.5 33.3 4.5 50.8z"
      />
    </svg>
  );
}

export function InstructorSignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setBusy(true);
    try {
      setPendingSignupPath('instructor');
      await signUpWithEmail(values.email, values.password, {
        displayName: values.name,
        role: 'instructor',
      });
      toast({
        title: 'Account created',
        description: 'Welcome to the instructor portal.',
      });
      router.push(consumePendingSignupRedirect());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not create account.';
      toast({ title: 'Sign-up failed', description: message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  const handleGoogleSignUp = async () => {
    setBusy(true);
    try {
      setPendingSignupPath('instructor');
      const result = await signInWithGoogle();
      if (!result) return;
      toast({
        title: 'Account created',
        description: 'Signed up with Google as an instructor.',
      });
      router.push(consumePendingSignupRedirect());
    } catch (error: unknown) {
      setPendingSignupPath(null);
      const message = error instanceof Error ? error.message : 'Could not sign up with Google.';
      toast({ title: 'Sign-up failed', description: message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Button
        variant="outline"
        className="h-11 w-full rounded-2xl border-border/80 bg-background text-sm font-medium shadow-sm hover:bg-secondary/60"
        onClick={handleGoogleSignUp}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-[0.65rem] font-medium uppercase tracking-[0.12em]">
          <span className="bg-card px-3 text-muted-foreground">or email</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Instructor" autoComplete="name" {...field} />
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
                <FormLabel className="text-xs font-medium text-muted-foreground">Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@school.edu" autoComplete="email" {...field} />
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
                <div className="flex items-center justify-between gap-2">
                  <FormLabel className="text-xs font-medium text-muted-foreground">Password</FormLabel>
                  <span className="text-[0.65rem] text-muted-foreground/80">Min. 8 characters</span>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="brand-button mt-1 h-11 w-full rounded-2xl text-sm"
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="inline-flex items-center gap-2">
                Create instructor account
                <ArrowRight className="h-4 w-4 opacity-90" />
              </span>
            )}
          </Button>
        </form>
      </Form>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <span>Next up:</span>
        <span className="inline-flex items-center rounded-full bg-primary/8 px-2.5 py-0.5 font-medium text-primary">
          Instructor portal
        </span>
      </p>
    </div>
  );
}
