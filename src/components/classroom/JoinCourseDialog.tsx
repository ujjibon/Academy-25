'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { joinCourseByCode } from '@/lib/classroom-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function JoinCourseDialog({ onJoined }: { onJoined?: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleJoin = async () => {
    if (!user || !code.trim()) return;
    setLoading(true);
    try {
      const course = await joinCourseByCode(code, user.uid);
      toast({ title: 'Joined!', description: `You joined ${course.title}` });
      setOpen(false);
      setCode('');
      onJoined?.();
      router.push(`/classroom/${course.id}/stream`);
    } catch (e: unknown) {
      toast({
        title: 'Could not join',
        description: e instanceof Error ? e.message : 'Invalid class code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="brand-button-ghost">
          <UserPlus className="mr-2 h-4 w-4" />
          Join with code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a class</DialogTitle>
          <DialogDescription>Enter the 6-character class code from your instructor.</DialogDescription>
        </DialogHeader>
        <JoinForm code={code} setCode={setCode} loading={loading} onJoin={handleJoin} />
      </DialogContent>
    </Dialog>
  );
}

function JoinForm({
  code,
  setCode,
  loading,
  onJoin,
}: {
  code: string;
  setCode: (v: string) => void;
  loading: boolean;
  onJoin: () => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="classCode">Class code</Label>
        <Input
          id="classCode"
          placeholder="e.g. ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="uppercase tracking-widest"
        />
      </div>
      <Button onClick={onJoin} disabled={loading || code.length < 4} className="w-full brand-button">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Join class
      </Button>
    </div>
  );
}
