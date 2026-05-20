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

interface BootcampStudioContentProps {
  showHeader?: boolean;
  onPublished?: () => void;
}

export function BootcampStudioContent({
  showHeader = true,
  onPublished,
}: BootcampStudioContentProps) {
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
          'Sections, materials, timeline, and project submissions are ready to publish.',
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
        instructorName: userProfile?.displayName || user.displayName || 'Instructor',
      });
      setPublishedClassCode(result.classroom.classCode);
      setPublishedCourseId(result.classroom.id);
      toast({
        title: 'Bootcamp published',
        description: `Classroom ${result.classroom.classCode} with ${result.assignmentsCreated} project submissions.`,
      });
      onPublished?.();
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

  const handleManualPreview = () => {
    setPlan(manualPlan);
    setPublishedClassCode(null);
    setPublishedCourseId(null);
    toast({
      title: 'Manual plan ready',
      description: 'Review the plan below, then publish to create your classroom.',
    });
  };

  return (
    <div className="space-y-6">
      {showHeader ? (
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">Bootcamp Studio</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            AI agent or manual builder — publish a full bootcamp as a live classroom.
          </p>
        </div>
      ) : null}

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

        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                AI Bootcamp Agent
              </CardTitle>
              <CardDescription>
                Describe your bootcamp or upload a curriculum PDF. Generates sections, materials,
                timeline, and mentorship setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bootcamp-prompt">Prompt</Label>
                <Textarea
                  id="bootcamp-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={5}
                  placeholder="Example: 8-week AI Product bootcamp with weekly projects, mentor sessions, and capstone submissions..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bootcamp-pdf">Upload PDF (optional)</Label>
                <Input
                  id="bootcamp-pdf"
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
                Generate bootcamp plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
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
