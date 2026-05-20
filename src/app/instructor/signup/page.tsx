'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Instructor sign-up is unified at /signup?path=instructor */
export default function InstructorSignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signup?path=instructor');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
