'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { GenerateSkillTrainingOutput } from '@/ai/flows/generate-skill-training-flow';
import type { SkillTrainingProgram } from '@/lib/training-types';
import { getStoredTrainings, saveTraining } from '@/lib/training-service';
import {
  Loader2,
  Sparkles,
  GraduationCap,
  Award,
  ChevronRight,
  Target,
} from 'lucide-react';

export default function TrainingPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [skill, setSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'beginner'
  );
  const [goals, setGoals] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [trainings, setTrainings] = useState<SkillTrainingProgram[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user?.uid) {
      setTrainings(getStoredTrainings(user.uid));
    }
  }, [user?.uid]);

  const handleGenerate = async () => {
    if (!skill.trim()) {
      toast({ title: 'Enter a skill', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Sign in required', description: 'Log in to generate training.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/skill-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: skill.trim(),
          skillLevel,
          goals: goals.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }

      const result = (await res.json()) as GenerateSkillTrainingOutput;
      const program: SkillTrainingProgram = {
        ...result,
        createdAt: new Date().toISOString(),
        status: 'in_progress',
      };

      saveTraining(user.uid, program);
      setTrainings(getStoredTrainings(user.uid));
      toast({
        title: 'Training program ready',
        description: `${result.modules.length} modules · ${result.durationWeeks} weeks`,
      });
      router.push(`/training/${program.id}`);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Generation failed',
        description: e instanceof Error ? e.message : 'Try a different skill name.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="dashboard-hero">
          <span className="dashboard-kicker">Professional development</span>
          <h1 className="font-dashboard-title text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Skills Training
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Enter any skill — AI builds a full professional training program with modules,
            exercises, capstone project, and a downloadable certificate when you complete it.
          </p>
        </div>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate training from a skill
            </CardTitle>
            <CardDescription>
              e.g. React, Leadership, Excel, UX Research, Machine Learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill">Skill to master</Label>
              <Input
                id="skill"
                placeholder="What skill do you want professional training for?"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Your current level</Label>
                <Select
                  value={skillLevel}
                  onValueChange={(v) =>
                    setSkillLevel(v as 'beginner' | 'intermediate' | 'advanced')
                  }
                  disabled={isGenerating}
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
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="goals">Goals (optional)</Label>
                <Textarea
                  id="goals"
                  placeholder="Job role, certification target, timeline…"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={2}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate} disabled={isGenerating || !user}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building program…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate full training
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="ml-2">
              <Link href="/training/certificates">
                <Award className="mr-2 h-4 w-4" />
                My certificates
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {trainings.length > 0 && (
          <Card className="brand-card">
            <CardHeader>
              <CardTitle>Your training programs</CardTitle>
              <CardDescription>Programs generated for your skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {trainings.map((t) => (
                <Link
                  key={t.id}
                  href={`/training/${t.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.modules.length} modules · {t.durationWeeks} weeks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                      {t.status === 'completed' ? 'Completed' : 'In progress'}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {userProfile && (
          <Card className="brand-card border-dashed">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Course certificates
              </CardTitle>
              <CardDescription>
                Complete any catalog course to 100% progress to unlock course certificates on the
                course page and in My certificates.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
