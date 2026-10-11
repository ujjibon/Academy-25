'use client';

import { useEffect, useMemo, useState, type ElementType } from 'react';
import type { Course, Lesson, LearningActivity } from '@/lib/data-provider';
import {
  LessonPanel,
  LessonPanelContent,
  LessonPanelDescription,
  LessonPanelFooter,
  LessonPanelHeader,
  LessonPanelTitle,
} from '@/components/courses/LessonPanel';
import { InteractiveQuizPlayer } from '@/components/courses/InteractiveQuizPlayer';
import { CourseTutor } from '@/components/courses/CourseTutor';
import { CodeWorkspace } from '@/components/courses/CodeWorkspace';
import { TranslationBar } from '@/components/classroom/TranslationBar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileCheck,
  FileUp,
  FlaskConical,
  Lightbulb,
  Loader2,
  Lock,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import {
  getProjectCodeConfig,
  isProgrammingCourse,
} from '@/lib/programming-course';
import { evaluateSubmittedTask, type EvaluateSubmittedTaskOutput } from '@/ai/flows/evaluate-submitted-task';

type StepId = 'learn' | 'practice' | 'project' | 'assess' | 'done';

const STEPS: { id: StepId; label: string; icon: ElementType }[] = [
  { id: 'learn', label: 'Learn', icon: Lightbulb },
  { id: 'practice', label: 'Practice', icon: FlaskConical },
  { id: 'project', label: 'Project', icon: Target },
  { id: 'assess', label: 'Assess', icon: ClipboardCheck },
  { id: 'done', label: 'Done', icon: Sparkles },
];

function defaultObjectives(lesson: Lesson): string[] {
  if (lesson.objectives?.length) return lesson.objectives;
  return [
    `Explain the core ideas in “${lesson.title}” in your own words`,
    `Apply the ideas in the project: ${lesson.project.title}`,
    'Pass the practice checkpoint before the final assessment',
  ];
}

function defaultActivities(lesson: Lesson): LearningActivity[] {
  if (lesson.activities?.length) return lesson.activities;
  return [
    {
      id: 'plan',
      title: 'Plan your approach',
      description: 'List 3 steps you will take before producing the deliverable.',
    },
    {
      id: 'draft',
      title: 'Create a first draft',
      description: lesson.project.description,
    },
    {
      id: 'review',
      title: 'Self-review',
      description: 'Check clarity, completeness, and whether you met the project goal.',
    },
  ];
}

function defaultTakeaways(lesson: Lesson): string[] {
  if (lesson.keyTakeaways?.length) return lesson.keyTakeaways;
  const firstSentence = lesson.introduction.text.split(/(?<=\.)\s+/)[0] || lesson.introduction.text;
  return [
    firstSentence,
    'Practice with feedback beats passive reading — check answers as you go.',
    'Ship a small artifact (the project) so the skill sticks.',
  ];
}

export function GuidedLessonFlow({
  course,
  lesson,
  autoStartAi = true,
  onLessonComplete,
}: {
  course: Course;
  lesson: Lesson;
  autoStartAi?: boolean;
  onLessonComplete?: (payload: { assessmentScore: number }) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<StepId>('learn');
  const [introText, setIntroText] = useState(lesson.introduction.text);
  const [checkedObjectives, setCheckedObjectives] = useState<Record<number, boolean>>({});
  const [revealedTakeaways, setRevealedTakeaways] = useState(false);
  const [learnDone, setLearnDone] = useState(false);
  const [practiceDone, setPracticeDone] = useState(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [projectChecks, setProjectChecks] = useState<Record<string, boolean>>({});
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [assessDone, setAssessDone] = useState(false);
  const [assessScore, setAssessScore] = useState<number | null>(null);
  const [quizKey, setQuizKey] = useState({ practice: 0, assess: 0 });

  const [submissionText, setSubmissionText] = useState('');
  const [codeSubmission, setCodeSubmission] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionFileDataUri, setSubmissionFileDataUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<EvaluateSubmittedTaskOutput | null>(null);

  const isProgramming = isProgrammingCourse(course);
  const codeProjectConfig = useMemo(
    () => (isProgramming ? getProjectCodeConfig(course, lesson.project) : null),
    [course, lesson.project, isProgramming]
  );

  const objectives = useMemo(() => defaultObjectives(lesson), [lesson]);
  const activities = useMemo(() => defaultActivities(lesson), [lesson]);
  const takeaways = useMemo(() => defaultTakeaways(lesson), [lesson]);

  const objectivesComplete =
    objectives.length > 0 && objectives.every((_, i) => checkedObjectives[i]);
  const activitiesComplete = activities.every((a) => projectChecks[a.id]);

  const unlocked: Record<StepId, boolean> = {
    learn: true,
    practice: learnDone,
    project: practiceDone,
    assess: practiceDone && projectSubmitted,
    done: assessDone,
  };

  useEffect(() => {
    setStep('learn');
    setIntroText(lesson.introduction.text);
    setCheckedObjectives({});
    setRevealedTakeaways(false);
    setLearnDone(false);
    setPracticeDone(false);
    setPracticeScore(null);
    setProjectChecks({});
    setProjectSubmitted(false);
    setAssessDone(false);
    setAssessScore(null);
    setFeedback(null);
    setSubmissionText('');
    setCodeSubmission('');
    setSubmissionFile(null);
    setSubmissionFileDataUri(null);
    setQuizKey((k) => ({ practice: k.practice + 1, assess: k.assess + 1 }));
  }, [course.id, lesson.id]);

  const overallPct = !learnDone
    ? Math.round(
        (Object.values(checkedObjectives).filter(Boolean).length / Math.max(objectives.length, 1)) * 20
      )
    : !practiceDone
      ? 30
      : !projectSubmitted
        ? 55
        : !assessDone
          ? 75
          : 100;

  const goTo = (next: StepId) => {
    if (!unlocked[next] && next !== 'learn') {
      toast({
        title: 'Step locked',
        description: 'Finish the previous checkpoint to unlock this step.',
        variant: 'destructive',
      });
      return;
    }
    setStep(next);
  };

  const finishLearn = () => {
    if (!objectivesComplete) {
      toast({
        title: 'Check your objectives',
        description: 'Mark each learning objective once you can explain it.',
        variant: 'destructive',
      });
      return;
    }
    setRevealedTakeaways(true);
    setLearnDone(true);
    setStep('practice');
    toast({ title: 'Learn phase complete', description: 'Time for interactive practice.' });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSubmissionFile(file);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setSubmissionFileDataUri(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProjectSubmit = async () => {
    if (!activitiesComplete) {
      toast({
        title: 'Finish activity checklist',
        description: 'Check off each hands-on step before submitting.',
        variant: 'destructive',
      });
      return;
    }
    const codeBody = codeProjectConfig ? codeSubmission.trim() : '';
    const textBody = submissionText.trim();
    if (codeProjectConfig && !codeBody && !textBody && !submissionFile) {
      toast({
        title: 'Submission is empty',
        description: 'Add code, notes, or a file before submitting.',
        variant: 'destructive',
      });
      return;
    }
    if (!codeProjectConfig && !textBody && !submissionFile) {
      toast({
        title: 'Submission is empty',
        description: 'Add your work before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const submissionPayload = codeProjectConfig
        ? [
            `Language: ${codeProjectConfig.language}`,
            '',
            '```',
            codeBody || '(no code in editor)',
            '```',
            textBody ? `\nNotes:\n${textBody}` : '',
          ].join('\n')
        : textBody;

      const result = await evaluateSubmittedTask({
        taskDescription: lesson.project.description,
        submissionText: submissionPayload,
        submissionFile: submissionFileDataUri || undefined,
        studentLevel: 'beginner',
        feedbackRequest: codeProjectConfig
          ? 'Evaluate this as source code. Comment on correctness, style, and whether it meets the project requirements.'
          : 'Evaluate this masters-class project for clarity, completeness, and practical usefulness.',
      });
      setFeedback(result);
      setProjectSubmitted(true);
      toast({ title: 'Feedback received', description: 'Project checkpoint unlocked assessment.' });
    } catch {
      // Still allow progress if AI eval fails — don't block learning
      setProjectSubmitted(true);
      toast({
        title: 'Saved locally',
        description: 'AI feedback unavailable, but your project checkpoint is marked complete.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lesson-page w-full space-y-6">
      <LessonPanel>
        <LessonPanelHeader className="pb-3">
          <span className="stat-card-label">Guided learning path</span>
          <p className="stat-card-value mt-1">{overallPct}%</p>
          <div className="lesson-progress-track mt-3 w-full">
            <div className="lesson-progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
        </LessonPanelHeader>
        <LessonPanelContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isCurrent = step === s.id;
              const isOpen = unlocked[s.id];
              const isComplete =
                (s.id === 'learn' && learnDone) ||
                (s.id === 'practice' && practiceDone) ||
                (s.id === 'project' && projectSubmitted) ||
                (s.id === 'assess' && assessDone) ||
                (s.id === 'done' && assessDone);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  className={cn(
                    'flex min-h-11 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-xs transition-colors sm:px-3 sm:text-sm',
                    isCurrent && 'border-royal bg-royal text-white shadow-[0_2px_8px_rgb(0_19_158/0.25)]',
                    !isCurrent && isComplete && 'border-royal/35 bg-royal/10 text-royal',
                    !isCurrent && !isComplete && isOpen && 'border-royal/15 text-midnight/80 hover:bg-royal/10 hover:text-royal',
                    !isOpen && 'border-royal/10 text-midnight/40 opacity-70'
                  )}
                >
                  {!isOpen ? (
                    <Lock className="h-4 w-4 shrink-0" />
                  ) : isComplete && !isCurrent ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    {i + 1}. {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </LessonPanelContent>
      </LessonPanel>

      {step === 'learn' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <LessonPanel>
            <LessonPanelHeader>
              <LessonPanelTitle>Learn the concept</LessonPanelTitle>
              <LessonPanelDescription>
                Read carefully, then check off each objective you can explain.
              </LessonPanelDescription>
            </LessonPanelHeader>
            <LessonPanelContent className="space-y-5">
              <TranslationBar text={lesson.introduction.text} onTranslated={setIntroText} />
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed sm:text-base">
                <p>{introText}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-royal" />
                  Learning objectives
                </h4>
                {objectives.map((obj, i) => (
                  <button
                    key={obj}
                    type="button"
                    onClick={() =>
                      setCheckedObjectives((prev) => ({ ...prev, [i]: !prev[i] }))
                    }
                    className={cn(
                      'flex w-full items-start gap-3 rounded-[calc(var(--radius)-8px)] border p-3 text-left text-sm transition-colors',
                      checkedObjectives[i]
                        ? 'border-royal/40 bg-royal/10 text-midnight'
                        : 'border-royal/15 hover:bg-royal/5'
                    )}
                  >
                    {checkedObjectives[i] ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-dark" />
                    )}
                    <span>{obj}</span>
                  </button>
                ))}
              </div>

              {(revealedTakeaways || learnDone) && (
                <div className="rounded-[calc(var(--radius)-8px)] border border-border bg-surface-muted-deep p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Key takeaways</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {takeaways.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </LessonPanelContent>
            <LessonPanelFooter>
              <Button className="brand-button" onClick={finishLearn} disabled={!objectivesComplete}>
                Unlock practice →
              </Button>
            </LessonPanelFooter>
          </LessonPanel>

          <LessonPanel>
            <LessonPanelHeader>
              <LessonPanelTitle>AI coach</LessonPanelTitle>
              <LessonPanelDescription>Ask for simpler explanations or examples anytime.</LessonPanelDescription>
            </LessonPanelHeader>
            <LessonPanelContent>
              <div data-ai-tutor>
                <CourseTutor
                  course={course}
                  currentLesson={lesson}
                  autoStartTeaching={autoStartAi}
                />
              </div>
            </LessonPanelContent>
          </LessonPanel>
        </div>
      )}

      {step === 'practice' && (
        <LessonPanel>
          <LessonPanelHeader>
            <LessonPanelTitle>Interactive practice</LessonPanelTitle>
            <LessonPanelDescription>
              One question at a time. Check each answer before moving on.
              {practiceScore != null ? ` Last score: ${practiceScore}%` : ''}
            </LessonPanelDescription>
          </LessonPanelHeader>
          <LessonPanelContent>
            <InteractiveQuizPlayer
              key={`practice-${quizKey.practice}`}
              quiz={lesson.practice}
              mode="practice"
              passThreshold={0.6}
              onComplete={({ score, passed }) => {
                setPracticeScore(score);
                setPracticeDone(true);
                toast({
                  title: passed ? 'Practice passed' : 'Practice finished',
                  description: passed
                    ? 'Project step unlocked.'
                    : 'You can continue — revisit practice anytime to improve.',
                });
                setStep('project');
              }}
            />
            {practiceDone && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setQuizKey((k) => ({ ...k, practice: k.practice + 1 }))}>
                  Retry practice
                </Button>
                <Button onClick={() => setStep('project')}>Continue to project →</Button>
              </div>
            )}
          </LessonPanelContent>
        </LessonPanel>
      )}

      {step === 'project' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <LessonPanel>
            <LessonPanelHeader>
              <LessonPanelTitle>{lesson.project.title}</LessonPanelTitle>
              <LessonPanelDescription>{lesson.project.description}</LessonPanelDescription>
            </LessonPanelHeader>
            <LessonPanelContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Hands-on checklist</h4>
                {activities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() =>
                      setProjectChecks((prev) => ({ ...prev, [activity.id]: !prev[activity.id] }))
                    }
                    className={cn(
                      'flex w-full items-start gap-3 rounded-[calc(var(--radius)-8px)] border p-3 text-left text-sm',
                      projectChecks[activity.id]
                        ? 'border-royal/40 bg-royal/10 text-midnight'
                        : 'border-royal/15 hover:bg-royal/5'
                    )}
                  >
                    {projectChecks[activity.id] ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-dark" />
                    )}
                    <span>
                      <span className="font-medium block">{activity.title}</span>
                      <span className="text-muted-foreground">{activity.description}</span>
                    </span>
                  </button>
                ))}
              </div>

              {codeProjectConfig && (
                <div className="space-y-2">
                  <Label>Your code</Label>
                  <CodeWorkspace
                    value={codeSubmission}
                    onChange={setCodeSubmission}
                    language={codeProjectConfig.language}
                    starterCode={codeProjectConfig.starterCode}
                    enablePreview={codeProjectConfig.enablePreview}
                    enableConsole={codeProjectConfig.enableConsole}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="guided-file">Attach file (optional)</Label>
                <Input
                  id="guided-file"
                  type="file"
                  onChange={handleFileChange}
                  accept={
                    isProgramming
                      ? '.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt,.js,.jsx,.ts,.tsx,.py,.html,.css'
                      : '.pdf,.doc,.docx,.png,.jpg,.jpeg'
                  }
                />
                {submissionFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileCheck className="h-4 w-4 text-royal" />
                    {submissionFile.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guided-notes">
                  {isProgramming ? 'Notes (optional)' : 'Your work / notes'}
                </Label>
                <Textarea
                  id="guided-notes"
                  className="min-h-[120px]"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste your deliverable, outline, or reflection..."
                />
              </div>
            </LessonPanelContent>
            <LessonPanelFooter className="flex flex-wrap gap-2">
              <Button onClick={handleProjectSubmit} disabled={isSubmitting || !activitiesComplete}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for AI feedback
              </Button>
              <Button
                variant="outline"
                disabled={!activitiesComplete || projectSubmitted}
                onClick={() => {
                  setProjectSubmitted(true);
                  setStep('assess');
                  toast({
                    title: 'Project checkpoint saved',
                    description: 'Assessment unlocked. You can still submit for AI feedback later.',
                  });
                }}
              >
                Continue to assessment →
              </Button>
              {projectSubmitted && (
                <Button variant="secondary" onClick={() => setStep('assess')}>
                  Open assessment
                </Button>
              )}
            </LessonPanelFooter>
          </LessonPanel>

          <LessonPanel className="min-h-[320px]">
            <LessonPanelHeader>
              <LessonPanelTitle>AI project feedback</LessonPanelTitle>
              <LessonPanelDescription>Scores and suggestions appear after you submit.</LessonPanelDescription>
            </LessonPanelHeader>
            <LessonPanelContent>
              {isSubmitting && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Evaluating...
                </div>
              )}
              {!isSubmitting && !feedback && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                  <FileUp className="h-10 w-10" />
                  <p>Complete the checklist, then submit your work.</p>
                </div>
              )}
              {feedback && (
                <div className="space-y-4">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Score: {feedback.score}/100</AlertTitle>
                    <AlertDescription>
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{feedback.feedback}</ReactMarkdown>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTitle>Mistakes</AlertTitle>
                    <AlertDescription>
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{feedback.summaryOfMistakes}</ReactMarkdown>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTitle>Improve next</AlertTitle>
                    <AlertDescription>
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{feedback.suggestions}</ReactMarkdown>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </LessonPanelContent>
          </LessonPanel>
        </div>
      )}

      {step === 'assess' && (
        <LessonPanel>
          <LessonPanelHeader>
            <LessonPanelTitle>Final assessment</LessonPanelTitle>
            <LessonPanelDescription>
              Demonstrate mastery. Pass at 60%+ to complete the lesson.
              {assessScore != null ? ` Score: ${assessScore}%` : ''}
            </LessonPanelDescription>
          </LessonPanelHeader>
          <LessonPanelContent>
            <InteractiveQuizPlayer
              key={`assess-${quizKey.assess}`}
              quiz={lesson.assessment}
              mode="assessment"
              passThreshold={0.6}
              onComplete={({ score, passed }) => {
                setAssessScore(score);
                if (passed) {
                  setAssessDone(true);
                  setStep('done');
                  onLessonComplete?.({ assessmentScore: score });
                  toast({
                    title: 'Lesson complete!',
                    description: `You scored ${score}% on the assessment.`,
                  });
                } else {
                  toast({
                    title: 'Keep practicing',
                    description: `You scored ${score}%. Retry to reach 60% and complete the lesson.`,
                    variant: 'destructive',
                  });
                }
              }}
            />
            {!assessDone && assessScore != null && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssessScore(null);
                    setQuizKey((k) => ({ ...k, assess: k.assess + 1 }));
                  }}
                >
                  Retry assessment
                </Button>
              </div>
            )}
          </LessonPanelContent>
        </LessonPanel>
      )}

      {step === 'done' && (
        <LessonPanel>
          <LessonPanelContent className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-royal/15 text-royal">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-midnight">Lesson mastered</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Practice {practiceScore ?? '—'}% · Assessment {assessScore ?? '—'}%. You finished the guided path for{' '}
              <strong className="text-foreground">{lesson.title}</strong>.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => goTo('learn')}>
                Review learn
              </Button>
              <Button variant="outline" onClick={() => goTo('project')}>
                Review project
              </Button>
            </div>
          </LessonPanelContent>
        </LessonPanel>
      )}
    </div>
  );
}
