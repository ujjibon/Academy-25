'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Upload, Wand2, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { publishBootcampPlan } from '@/lib/bootcamp-service';
import {
  createEmptyBootcampPlan,
  normalizeAiBootcampOutput,
  type BootcampPlan,
} from '@/lib/bootcamp-types';
import { BootcampManualBuilder } from '@/components/bootcamp/BootcampManualBuilder';
import { BootcampPlanPreview } from '@/components/bootcamp/BootcampPlanPreview';

export default function BootcampStudioPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ai');
  const [prompt, setPrompt] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [manualPlan, setManualPlan] = useState<BootcampPlan>(() => createEmptyBootcampPlan());
  const [plan, setPlan] = useState<BootcampPlan | null>(null);
  const [publishedClassCode, setPublishedClassCode] = useState<string | null>(null);
  const [publishedCourseId, setPublishedCourseId] = useState<string | null>(null);

  const canPublish = useMemo(
    () => Boolean(user && plan?.title && userProfile?.displayName),
    [user, userProfile, plan]
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
      const data = await res.json();
      const normalized = normalizeAiBootcampOutput(data);
      setPlan(normalized);
      setPublishedClassCode(null);
      setPublishedCourseId(null);
      toast({
        title: 'Bootcamp plan generated',
        description:
          'Sections, materials, timeline, project submissions, and mentorship are ready to execute.',
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

  const onPublish = async () => {
    if (!plan || !user) return;
    setIsPublishing(true);
    try {
      const result = await publishBootcampPlan({
        plan,
        instructorId: user.uid,
        instructorName: userProfile?.displayName || user.displayName || 'Admin',
      });
      setPublishedClassCode(result.classroom.classCode);
      setPublishedCourseId(result.classroom.id);
      toast({
        title: 'Bootcamp executed',
        description: `Created classroom ${result.classroom.classCode} with ${result.assignmentsCreated} project submissions.`,
      });
    } catch {
      toast({
        title: 'Execution failed',
        description: 'Please verify permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleManualPreview = () => {
    setPlan(manualPlan);
    setPublishedClassCode(null);
    setPublishedCourseId(null);
    toast({
      title: 'Manual plan ready',
      description: 'Review the bootcamp plan below, then execute to publish.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bootcamp Studio</h1>
        <p className="text-muted-foreground mt-1">
          Build bootcamps with an AI agent or manual creation. Execute the plan to create sections,
          course materials, timeline posts, project report submissions, and 1:1 mentorship.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ai" className="gap-2">
            <Wand2 className="h-4 w-4" />
            AI Agent
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <PenLine className="h-4 w-4" />
            Manual Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Bootcamp Agent
              </CardTitle>
              <CardDescription>
                Describe your bootcamp in a prompt or upload curriculum PDF. The agent generates
                sections, materials, timeline, project submissions, and mentorship setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Prompt</Label>
                <Textarea
                  id="requirements"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={6}
                  placeholder="Example: Build an 8-week AI Product bootcamp with weekly projects, mentor sessions, and capstone report submissions..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf">Upload PDF (optional)</Label>
                <Input
                  id="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                />
              </div>
              <Button onClick={onGenerate} disabled={isGenerating} className="brand-button">
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Generate Bootcamp Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <BootcampManualBuilder
            plan={manualPlan}
            onChange={setManualPlan}
            onPreview={handleManualPreview}
          />
        </TabsContent>
      </Tabs>

      {plan ? (
        <BootcampPlanPreview
          plan={plan}
          isPublishing={isPublishing}
          canPublish={canPublish}
          onPublish={onPublish}
          publishedClassCode={publishedClassCode}
          publishedCourseId={publishedCourseId}
        />
      ) : null}
    </div>
  );
}
