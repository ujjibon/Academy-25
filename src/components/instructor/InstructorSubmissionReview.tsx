'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { gradeSubmission } from '@/lib/classroom-service';
import type { CourseSubmissionWithAssignment } from '@/lib/classroom-types';
import { useToast } from '@/hooks/use-toast';

interface InstructorSubmissionReviewProps {
  row: CourseSubmissionWithAssignment;
  onGraded: () => void;
}

export function InstructorSubmissionReview({ row, onGraded }: InstructorSubmissionReviewProps) {
  const { submission, assignment } = row;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(submission.grade?.toString() ?? '');
  const [feedback, setFeedback] = useState(submission.instructorFeedback ?? '');
  const [saving, setSaving] = useState(false);

  const isProjectReport =
    Boolean(submission.githubUrl || submission.liveUrl) ||
    assignment.title.toLowerCase().includes('project') ||
    assignment.title.toLowerCase().includes('report');

  const handleGrade = async () => {
    const points = parseInt(grade, 10);
    if (Number.isNaN(points) || points < 0 || points > assignment.points) {
      toast({
        title: 'Invalid grade',
        description: `Enter a score between 0 and ${assignment.points}.`,
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await gradeSubmission(submission.courseId, submission.assignmentId, submission.id, {
        grade: points,
        instructorFeedback: feedback.trim() || undefined,
        status: 'graded',
      });
      toast({ title: 'Submission graded' });
      onGraded();
    } catch {
      toast({ title: 'Could not save grade', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="brand-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left px-6 py-4 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors rounded-t-[var(--radius)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-semibold truncate">{submission.studentName}</p>
                <StatusBadge status={submission.status} />
                {isProjectReport ? (
                  <Badge variant="outline" className="text-xs">
                    Project / report
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground truncate">{assignment.title}</p>
              {submission.submittedAt ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted {format(submission.submittedAt, 'PPp')}
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4 border-t">
            {submission.textResponse ? (
              <DetailBlock title="Written response" content={submission.textResponse} />
            ) : null}
            {submission.codeSubmission ? (
              <DetailBlock title="Code submission" content={submission.codeSubmission} mono />
            ) : null}
            {(submission.githubUrl || submission.liveUrl) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Project links</p>
                <div className="flex flex-wrap gap-2">
                  {submission.githubUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        GitHub
                      </a>
                    </Button>
                  ) : null}
                  {submission.liveUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Live demo
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
            {submission.aiFeedback ? (
              <DetailBlock title="AI feedback" content={submission.aiFeedback} />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor={`grade-${submission.id}`}>Grade (max {assignment.points})</Label>
                <Input
                  id={`grade-${submission.id}`}
                  type="number"
                  min={0}
                  max={assignment.points}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`feedback-${submission.id}`}>Instructor feedback</Label>
                <Textarea
                  id={`feedback-${submission.id}`}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Feedback for the student..."
                />
              </div>
            </div>
            <Button onClick={handleGrade} disabled={saving} className="brand-button" size="sm">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save grade & feedback
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DetailBlock({
  title,
  content,
  mono,
}: {
  title: string;
  content: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">{title}</p>
      <pre
        className={`text-sm whitespace-pre-wrap rounded-lg bg-muted/50 p-3 max-h-48 overflow-auto ${mono ? 'font-mono text-xs' : ''}`}
      >
        {content}
      </pre>
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
