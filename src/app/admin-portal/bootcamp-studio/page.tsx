'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Upload, BookOpenCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createClassroomCourse } from '@/lib/classroom-service';
import type { Course } from '@/lib/data-provider';

type BootcampOutput = {
  title: string;
  summary: string;
  timeline: { week: string; objective: string; deliverables: string[] }[];
  materials: { title: string; type: string; purpose: string }[];
  taskSubmissionFlow: {
    workflow: string[];
    evaluationCriteria: string[];
    aiSupport: string[];
  };
  dashboardConfig: {
    learner: { title: string; widgets: string[]; customizations: string[] };
    instructor: { title: string; widgets: string[]; customizations: string[] };
    admin: { title: string; widgets: string[]; customizations: string[] };
  };
  course: Course;
};

export default function BootcampStudioPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [result, setResult] = useState<BootcampOutput | null>(null);

  const canPublish = useMemo(
    () => Boolean(user && result?.course && userProfile?.displayName),
    [user, userProfile, result]
  );

  const onGenerate = async () => {
    if (!prompt.trim() && !pdfFile) {
      toast({
        title: 'Add requirements',
        description: 'Enter a prompt or upload a PDF.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const form = new FormData();
      form.append('prompt', prompt);
      if (pdfFile) form.append('pdf', pdfFile);

      const res = await fetch('/api/ai/bootcamp-designer', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = (await res.json()) as BootcampOutput;
      setResult(data);
      toast({
        title: 'Bootcamp design ready',
        description: 'Timeline, dashboards, materials, and task workflow generated.',
      });
    } catch {
      toast({
        title: 'Generation failed',
        description: 'Please refine the prompt and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onPublishClassroom = async () => {
    if (!result || !user) return;
    setIsPublishing(true);
    try {
      const classroom = await createClassroomCourse({
        title: result.course.title,
        description: result.course.description,
        coverImage: result.course.image || '/images/react-fundamentals.jpg',
        instructorId: user.uid,
        instructorName: userProfile?.displayName || user.displayName || 'Instructor',
        contentCourseId: result.course.id,
        courseContent: result.course,
      });
      toast({
        title: 'Published to classroom',
        description: `Class code: ${classroom.classCode}`,
      });
    } catch {
      toast({
        title: 'Publish failed',
        description: 'Please verify permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bootcamp Studio</h1>
        <p className="text-muted-foreground mt-1">
          Create dynamic bootcamps/courses with AI from prompt or PDF, including role-based dashboards and task submission planning.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Requirements Input
          </CardTitle>
          <CardDescription>
            Define requirements in prompt form or upload curriculum notes as PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requirements">Prompt</Label>
            <Textarea
              id="requirements"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="Example: Build an 8-week AI Product Management bootcamp with beginner and advanced tracks..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf">Upload PDF (optional)</Label>
            <Input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={onGenerate} disabled={isGenerating} className="brand-button">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Generate Bootcamp Plan
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{result.title}</CardTitle>
              <CardDescription>{result.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">Timeline</p>
              {result.timeline.map((item, index) => (
                <div key={`${item.week}-${index}`} className="rounded-lg border p-3">
                  <p className="font-medium text-sm">{item.week}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.objective}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.deliverables.map((d, i) => (
                      <Badge key={`${d}-${i}`} variant="secondary">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Materials & Task Submission</CardTitle>
              <CardDescription>AI-generated content packs and submission workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {result.materials.map((m, idx) => (
                  <div key={`${m.title}-${idx}`} className="rounded-lg border p-3">
                    <p className="font-medium text-sm">
                      {m.title} <span className="text-muted-foreground">({m.type})</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{m.purpose}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium">Task submission workflow</p>
                <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                  {result.taskSubmissionFlow.workflow.map((step, idx) => (
                    <li key={`${step}-${idx}`}>{step}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Role-Based Dashboard Customization</CardTitle>
              <CardDescription>Separate dashboard sections for learners, instructors, and admins.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {(['learner', 'instructor', 'admin'] as const).map((role) => (
                <div key={role} className="rounded-lg border p-3">
                  <p className="font-medium text-sm">{result.dashboardConfig[role].title}</p>
                  <p className="text-xs text-muted-foreground mt-2">Widgets</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {result.dashboardConfig[role].widgets.map((widget, idx) => (
                      <Badge key={`${widget}-${idx}`} variant="outline">
                        {widget}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Customizable options</p>
                  <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                    {result.dashboardConfig[role].customizations.map((custom, idx) => (
                      <li key={`${custom}-${idx}`}>{custom}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5" />
                Publish Course
              </CardTitle>
              <CardDescription>
                Publish generated course to classroom and reuse built-in task submission pages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onPublishClassroom} disabled={!canPublish || isPublishing}>
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publish to Classroom
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
