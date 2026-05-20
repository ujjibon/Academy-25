'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createStartupIdea, updateStartupIdea } from '@/lib/startup-service';
import type { StartupIdea } from '@/lib/startup-types';
import { Loader2 } from 'lucide-react';

type Props = {
  userId: string;
  userEmail?: string;
  userName?: string;
  idea?: StartupIdea;
};

export function IdeaForm({ userId, userEmail, userName, idea }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(idea?.title ?? '');
  const [problem, setProblem] = useState(idea?.problem ?? '');
  const [solution, setSolution] = useState(idea?.solution ?? '');
  const [market, setMarket] = useState(idea?.market ?? '');
  const [traction, setTraction] = useState(idea?.traction ?? '');
  const [team, setTeam] = useState(idea?.team ?? '');
  const [ask, setAsk] = useState(idea?.ask ?? '');
  const [stage, setStage] = useState<StartupIdea['stage']>(idea?.stage ?? 'discovery');

  const save = async (submit: boolean) => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const status = submit ? 'submitted' : idea?.status === 'submitted' ? 'submitted' : 'draft';
      if (idea) {
        await updateStartupIdea(idea.id, {
          title,
          problem,
          solution,
          market,
          traction,
          team,
          ask,
          stage,
          status: submit ? 'submitted' : status,
        });
        toast({ title: submit ? 'Idea submitted' : 'Draft saved' });
        router.push(`/startup/ideas/${idea.id}`);
      } else {
        const id = await createStartupIdea({
          ownerId: userId,
          ownerEmail: userEmail,
          ownerName: userName,
          title,
          problem,
          solution,
          market,
          traction,
          team,
          ask,
          stage,
          status: submit ? 'submitted' : 'draft',
        });
        toast({ title: submit ? 'Idea submitted' : 'Draft created' });
        router.push(`/startup/ideas/${id}`);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not save idea.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Idea title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Stage</Label>
        <Select value={stage} onValueChange={(v) => setStage(v as StartupIdea['stage'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discovery">Discovery</SelectItem>
            <SelectItem value="validation">Validation</SelectItem>
            <SelectItem value="build">Build</SelectItem>
            <SelectItem value="scale">Scale</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(
        [
          ['problem', 'Problem', problem, setProblem],
          ['solution', 'Solution', solution, setSolution],
          ['market', 'Market', market, setMarket],
          ['traction', 'Traction', traction, setTraction],
          ['team', 'Team', team, setTeam],
          ['ask', 'Ask / funding need', ask, setAsk],
        ] as const
      ).map(([id, label, val, set]) => (
        <div key={id} className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Textarea id={id} rows={3} value={val} onChange={(e) => set(e.target.value)} />
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={busy} onClick={() => save(false)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save draft'}
        </Button>
        <Button className="brand-button" disabled={busy} onClick={() => save(true)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit for review'}
        </Button>
      </div>
    </div>
  );
}
