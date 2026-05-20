'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { SkillTrainingProgram } from '@/lib/training-types';
import {
  getTrainingById,
  markTrainingComplete,
} from '@/lib/training-service';
import { CertificateDownloadButton } from '@/components/certificates/CertificateDownloadButton';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListChecks,
  BookOpen,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TrainingDetailPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = use(params);
  const { user, userProfile, loading: authLoading } = useAuth();
  const [program, setProgram] = useState<SkillTrainingProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const t = getTrainingById(user.uid, trainingId);
    setProgram(t);
    setLoading(false);
  }, [user?.uid, trainingId]);

  const handleComplete = () => {
    if (!user?.uid) return;
    const updated = markTrainingComplete(user.uid, trainingId);
    if (updated) {
      setProgram(updated);
      toast({
        title: 'Training completed!',
        description: 'You can now download your certificate.',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!program) {
    notFound();
  }

  const isCompleted = program.status === 'completed';
  const recipientName = userProfile?.displayName || 'Learner';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/training">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Training
          </Link>
        </Button>

        <div className="dashboard-hero">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge>{program.skill}</Badge>
            <Badge variant="outline">{program.durationWeeks} weeks</Badge>
            {isCompleted && (
              <Badge className="bg-primary/90">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
          <h1 className="font-dashboard-title text-3xl font-bold tracking-tight">
            {program.title}
          </h1>
          <p className="text-muted-foreground mt-2">{program.summary}</p>
        </div>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Learning objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {program.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Training modules
            </CardTitle>
            <CardDescription>Structured professional curriculum</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {program.modules.map((mod, index) => (
                <AccordionItem key={index} value={`mod-${index}`}>
                  <AccordionTrigger>
                    <span className="text-left">
                      Module {index + 1}: {mod.title}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({mod.durationHours}h)
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-muted-foreground">
                    <p>{mod.description}</p>
                    <div>
                      <p className="font-medium text-foreground mb-1">Topics</p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {mod.topics.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Hands-on exercises</p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {mod.exercises.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>Capstone project</CardTitle>
            <CardDescription>{program.capstoneProject.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>{program.capstoneProject.description}</p>
            <ul className="list-disc pl-5">
              {program.capstoneProject.deliverables.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {program.weeklySchedule.map((week, i) => (
                <li key={i} className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                  {week}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>Assessment & resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Assessment criteria</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {program.assessmentCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Recommended resources</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {program.recommendedResources.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="brand-card border-primary/20">
          <CardHeader>
            <CardTitle>Certificate of completion</CardTitle>
            <CardDescription>
              Mark training complete, then download your professional PDF certificate.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-center">
            {!isCompleted ? (
              <Button onClick={handleComplete}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark training complete
              </Button>
            ) : (
              <CertificateDownloadButton
                uid={user?.uid}
                payload={{
                  type: 'training',
                  title: program.title,
                  skillOrCourseId: program.id,
                  recipientName,
                  completionSummary: program.completionSummary,
                }}
                label="Download training certificate (PDF)"
              />
            )}
          </CardContent>
          {isCompleted && program.completionSummary && (
            <CardContent className="pt-0">
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <ReactMarkdown>{program.completionSummary}</ReactMarkdown>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
