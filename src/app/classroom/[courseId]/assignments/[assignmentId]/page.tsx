'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import {
  getAssignment,
  getStudentSubmission,
  submitAssignment,
} from '@/lib/classroom-service';
import type { ClassroomAssignment, AssignmentSubmission } from '@/lib/classroom-types';
import { useAuth } from '@/hooks/use-auth';
import { addXP } from '@/lib/firebase';
import { xpForAction } from '@/lib/xp-rules';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssignmentPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = use(params);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<ClassroomAssignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [textResponse, setTextResponse] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const a = await getAssignment(courseId, assignmentId);
      setAssignment(a);
      if (user && a) {
        const s = await getStudentSubmission(courseId, assignmentId, user.uid);
        setSubmission(s);
        if (s?.textResponse) setTextResponse(s.textResponse);
        if (s?.githubUrl) setGithubUrl(s.githubUrl);
        if (s?.liveUrl) setLiveUrl(s.liveUrl);
      }
      setLoading(false);
    }
    load();
  }, [courseId, assignmentId, user]);

  const handleSubmit = async () => {
    if (!user || !assignment) return;
    const now = new Date();
    const isLate = now > assignment.deadline;
    setSubmitting(true);
    try {
      await submitAssignment({
        assignmentId,
        courseId,
        studentId: user.uid,
        studentName: userProfile?.displayName || 'Student',
        textResponse: textResponse.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
        status: isLate ? 'late' : 'submitted',
      });
      await addXP(user.uid, xpForAction('submitProject'));
      toast({ title: 'Submitted!', description: `+${xpForAction('submitProject')} XP` });
      const s = await getStudentSubmission(courseId, assignmentId, user.uid);
      setSubmission(s);
    } catch {
      toast({ title: 'Submission failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!assignment) return <p>Assignment not found.</p>;

  const status = submission?.status || 'assigned';

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/classroom/${courseId}/classwork`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to classwork
        </Link>
      </Button>

      <Card className="brand-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{assignment.title}</CardTitle>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Due {format(assignment.deadline, 'PPP p')} · {assignment.points} points
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{assignment.description}</p>
        </CardContent>
      </Card>

      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="text-base">Your work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Written response</Label>
            <Textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              rows={5}
              placeholder="Type your answer..."
              disabled={status === 'graded'}
            />
          </div>
          <LinkFields githubUrl={githubUrl} setGithubUrl={setGithubUrl} liveUrl={liveUrl} setLiveUrl={setLiveUrl} status={status} />
          {submission?.instructorFeedback && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-1">Instructor feedback</p>
              <p>{submission.instructorFeedback}</p>
            </div>
          )}
          {submission?.aiFeedback && (
            <AiFeedbackBlock aiFeedback={submission.aiFeedback} />
          )}
          {status !== 'graded' && (
            <Button onClick={handleSubmit} disabled={submitting} className="brand-button w-full">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submission ? 'Update submission' : 'Turn in'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    assigned: 'outline',
    submitted: 'secondary',
    graded: 'default',
    late: 'destructive',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
}

function LinkFields({
  githubUrl,
  setGithubUrl,
  liveUrl,
  setLiveUrl,
  status,
}: {
  githubUrl: string;
  setGithubUrl: (v: string) => void;
  liveUrl: string;
  setLiveUrl: (v: string) => void;
  status: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>GitHub link</Label>
        <Input
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/..."
          disabled={status === 'graded'}
        />
      </div>
      <div className="space-y-2">
        <Label>Live project link</Label>
        <Input
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          placeholder="https://..."
          disabled={status === 'graded'}
        />
      </div>
    </>
  );
}

function AiFeedbackBlock({ aiFeedback }: { aiFeedback: string }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="font-medium mb-1 text-primary">AI feedback</p>
      <p>{aiFeedback}</p>
    </div>
  );
}
