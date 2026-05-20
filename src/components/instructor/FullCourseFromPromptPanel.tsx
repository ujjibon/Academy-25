'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClassroomCourse } from '@/lib/classroom-service';
import type { Course, CourseCategory } from '@/lib/data-provider';
import { useAuth } from '@/hooks/use-auth';
import {
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  Save,
  Sparkles,
  Upload,
  Wand2,
  Zap,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { groupLessonsIntoModules } from '@/lib/classroom-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { CourseOutline } from '@/ai/flows/course-lesson-schema';
import { flattenOutlineLessons } from '@/ai/flows/course-lesson-schema';
import type { AgentStep } from '@/ai/types/course-agent-types';
import { cn } from '@/lib/utils';

type GenerationMode = 'agentic' | 'quick';

interface FullCourseFromPromptPanelProps {
  embedded?: boolean;
  onCoursePublished?: () => void;
}

type ArchitectOptions = {
  lessonCount: number;
  category: CourseCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionsPerLesson: number;
};

export function FullCourseFromPromptPanel({
  embedded = false,
  onCoursePublished,
}: FullCourseFromPromptPanelProps) {
  const [mode, setMode] = useState<GenerationMode>('agentic');
  const [prompt, setPrompt] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ArchitectOptions>({
    lessonCount: 6,
    category: 'general',
    difficulty: 'intermediate',
    questionsPerLesson: 12,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generated, setGenerated] = useState<Course | null>(null);
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [agentSummary, setAgentSummary] = useState('');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [refineInput, setRefineInput] = useState('');
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const roadmap = useMemo(() => {
    if (!generated) return '';
    const modules = groupLessonsIntoModules(generated.lessons);
    return modules
      .map((m, i) => `Week ${i + 1}: ${m.title} — ${m.lessonIds.length} lessons`)
      .join('\n');
  }, [generated]);

  const updateStep = useCallback((step: AgentStep) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === step.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = step;
        return next;
      }
      return [...prev, step];
    });
  }, []);

  const runAgenticPipeline = async (brief: string, sourceType: 'prompt' | 'pdf') => {
    setSteps([]);
    setOutline(null);
    setAgentSummary('');

    updateStep({ id: 'plan', label: 'Architecting course outline', status: 'running' });
    const planRes = await fetch('/api/ai/course-architect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'plan', brief, sourceType, options }),
    });
    if (!planRes.ok) throw new Error('Planning failed');
    const planData = await planRes.json();
    const plannedOutline = planData.outline as CourseOutline;
    setOutline(plannedOutline);
    setAgentSummary(planData.agentSummary || plannedOutline.agentNotes || '');
    const flat = flattenOutlineLessons(plannedOutline);
    updateStep({
      id: 'plan',
      label: 'Architecting course outline',
      status: 'done',
      detail: `${flat.length} lessons · ${plannedOutline.modules.length} modules`,
    });

    const builtLessons: Course['lessons'] = [];
    for (const spec of flat) {
      const stepId = `lesson-${spec.id}`;
      updateStep({ id: stepId, label: `Building: ${spec.title}`, status: 'running' });
      const lessonRes = await fetch('/api/ai/course-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'lesson',
          brief,
          outline: plannedOutline,
          lessonId: spec.id,
          options: { questionsPerLesson: options.questionsPerLesson },
        }),
      });
      if (!lessonRes.ok) throw new Error(`Lesson ${spec.id} failed`);
      const { lesson } = await lessonRes.json();
      builtLessons.push(lesson);
      updateStep({
        id: stepId,
        label: `Building: ${spec.title}`,
        status: 'done',
        detail: `${lesson.practice.questions.length}+${lesson.assessment.questions.length} questions`,
      });
    }

    updateStep({ id: 'assemble', label: 'Assembling course', status: 'running' });
    const course: Course = {
      id: plannedOutline.id,
      title: plannedOutline.title,
      description: plannedOutline.description,
      image: plannedOutline.image,
      category: plannedOutline.category,
      lessons: builtLessons.sort((a, b) => Number(a.id) - Number(b.id)),
    };
    setGenerated(course);
    updateStep({ id: 'assemble', label: 'Assembling course', status: 'done' });
    return course;
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !pdfFile) {
      toast({
        title: 'Add requirements',
        description: 'Enter a prompt or upload a PDF.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setGenerated(null);
    setSteps([]);

    try {
      if (mode === 'quick') {
        const topic = prompt.trim() || 'Course from uploaded document';
        const res = await fetch('/api/ai/generate-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) throw new Error('Quick generation failed');
        const result = (await res.json()) as Course;
        setGenerated(result);
        toast({ title: 'Course generated', description: `${result.lessons.length} lessons ready.` });
      } else {
        let brief = prompt.trim();
        let sourceType: 'prompt' | 'pdf' = 'prompt';

        if (pdfFile) {
          setSteps([
            { id: 'plan', label: 'Reading PDF & architecting outline', status: 'running' },
          ]);
          const form = new FormData();
          form.append('phase', 'full');
          form.append('prompt', prompt);
          form.append('pdf', pdfFile);
          form.append('options', JSON.stringify(options));
          const res = await fetch('/api/ai/course-architect', { method: 'POST', body: form });
          if (!res.ok) throw new Error('PDF agent pipeline failed');
          const data = await res.json();
          setGenerated(data.course as Course);
          setOutline(data.outline as CourseOutline);
          setAgentSummary(data.agentSummary || '');
          setSteps((data.steps as AgentStep[]) || []);
        } else {
          await runAgenticPipeline(brief, sourceType);
        }

        toast({
          title: 'Agentic course ready',
          description: 'Review modules, refine with AI, then publish.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Generation failed',
        description: mode === 'agentic' ? 'Agent stopped — try fewer lessons or a shorter brief.' : 'Try a shorter prompt.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!generated || !refineInput.trim()) return;
    setIsRefining(true);
    try {
      const res = await fetch('/api/ai/course-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'refine',
          brief: prompt,
          instruction: refineInput.trim(),
          course: generated,
        }),
      });
      if (!res.ok) throw new Error('Refine failed');
      const data = await res.json();
      setGenerated(data.course as Course);
      setRefineInput('');
      toast({ title: 'Course refined', description: data.response?.slice(0, 120) || 'Updates applied.' });
    } catch {
      toast({ title: 'Refinement failed', variant: 'destructive' });
    } finally {
      setIsRefining(false);
    }
  };

  const handleSave = async () => {
    if (!generated || !user) return;
    setIsSaving(true);
    try {
      const course = await createClassroomCourse({
        title: generated.title,
        description: generated.description,
        coverImage: generated.image.startsWith('/') ? generated.image : '/images/react-fundamentals.jpg',
        instructorId: user.uid,
        instructorName: userProfile?.displayName || 'Instructor',
        contentCourseId: generated.id,
        courseContent: generated,
      });
      toast({ title: 'Course published', description: `Class code: ${course.classCode}` });
      onCoursePublished?.();
      if (!embedded) router.push(`/classroom/${course.id}/stream`);
    } catch {
      toast({ title: 'Publish failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="brand-card">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="h-5 w-5" />
                {mode === 'agentic' ? 'Agentic course architect' : 'Quick generate'}
              </CardTitle>
              <CardDescription className="mt-1">
                {mode === 'agentic'
                  ? 'AI plans your curriculum, builds each lesson as a separate agent step, then lets you refine before publishing.'
                  : 'One-shot full course generation from your brief.'}
              </CardDescription>
            </div>
            <Tabs value={mode} onValueChange={(v) => setMode(v as GenerationMode)}>
              <TabsList>
                <TabsTrigger value="agentic" className="gap-1.5">
                  <Bot className="h-4 w-4" />
                  Agentic
                </TabsTrigger>
                <TabsTrigger value="quick" className="gap-1.5">
                  <Zap className="h-4 w-4" />
                  Quick
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-prompt">Course brief</Label>
            <Textarea
              id="course-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={7}
              disabled={isLoading}
              placeholder="Describe audience, goals, weekly topics, project style, and assessment depth..."
            />
          </div>

          {mode === 'agentic' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="course-pdf">Curriculum PDF (optional)</Label>
                <Input
                  id="course-pdf"
                  type="file"
                  accept="application/pdf"
                  disabled={isLoading}
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Lessons</Label>
                  <Select
                    value={String(options.lessonCount)}
                    onValueChange={(v) => setOptions((o) => ({ ...o, lessonCount: Number(v) }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 5, 6, 8, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} lessons
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={options.category}
                    onValueChange={(v) =>
                      setOptions((o) => ({ ...o, category: v as CourseCategory }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select
                    value={options.difficulty}
                    onValueChange={(v) =>
                      setOptions((o) => ({
                        ...o,
                        difficulty: v as ArchitectOptions['difficulty'],
                      }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Questions / lesson</Label>
                  <Select
                    value={String(options.questionsPerLesson)}
                    onValueChange={(v) =>
                      setOptions((o) => ({ ...o, questionsPerLesson: Number(v) }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[8, 12, 16, 20].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} each
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isLoading || (!prompt.trim() && !pdfFile)}
            className="brand-button"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === 'agentic' ? (
              <Bot className="mr-2 h-4 w-4" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {mode === 'agentic' ? 'Run agentic architect' : 'Generate course'}
          </Button>

          {isLoading && steps.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Agent progress
              </p>
              <ul className="space-y-1.5">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-2 text-sm">
                    {step.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span className={cn(step.status === 'running' && 'font-medium')}>
                      {step.label}
                      {step.detail ? (
                        <span className="text-muted-foreground"> — {step.detail}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {generated && (
        <>
          {(agentSummary || outline) && mode === 'agentic' && (
            <Card className="brand-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Architect notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {agentSummary ? <p>{agentSummary}</p> : null}
                {outline && (
                  <div className="flex flex-wrap gap-2">
                    {outline.modules.map((m) => (
                      <Badge key={m.id} variant="secondary">
                        {m.weekLabel || m.title}: {m.lessons.length} lessons
                      </Badge>
                    ))}
                    {generated.category === 'programming' && (
                      <Badge variant="outline">Programming · {outline.codeLanguage}</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="brand-card">
            <CardHeader>
              <CardTitle>{generated.title}</CardTitle>
              <CardDescription>{generated.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roadmap && (
                <div>
                  <h3 className="font-semibold mb-2">Weekly study plan</h3>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    {roadmap}
                  </pre>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">
                  {generated.lessons.length} lessons in{' '}
                  {groupLessonsIntoModules(generated.lessons).length} modules
                </h3>
                <Accordion type="single" collapsible>
                  {groupLessonsIntoModules(generated.lessons).map((mod) => (
                    <AccordionItem key={mod.id} value={mod.id}>
                      <AccordionTrigger>{mod.title}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {mod.lessonIds.map((lid) => {
                            const lesson = generated.lessons.find((l) => l.id === lid);
                            return lesson ? (
                              <li key={lid}>
                                {lesson.title}
                                <span className="text-muted-foreground">
                                  {' '}
                                  · {lesson.practice.questions.length} practice /{' '}
                                  {lesson.assessment.questions.length} assessment
                                </span>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {mode === 'agentic' && (
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="refine-prompt">Refine with AI agent</Label>
                  <Textarea
                    id="refine-prompt"
                    rows={3}
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    placeholder='e.g. "Make lesson 3 harder and add 5 more assessment questions" or "Rewrite project for lesson 2 as a pair exercise"'
                    disabled={isRefining}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefine}
                    disabled={isRefining || !refineInput.trim()}
                  >
                    {isRefining ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Apply refinement
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving} className="brand-button w-full sm:w-auto">
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Publish to classroom
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
