'use client';
import { useState } from 'react';
import type { Lesson, Course, Quiz } from '@/lib/data-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LessonPanel,
  LessonPanelContent,
  LessonPanelDescription,
  LessonPanelFooter,
  LessonPanelHeader,
  LessonPanelTitle,
} from '@/components/courses/LessonPanel';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Lightbulb, Loader2, XCircle, FileUp, FileCheck } from 'lucide-react';
import { evaluateSubmittedTask, type EvaluateSubmittedTaskOutput } from '@/ai/flows/evaluate-submitted-task';
import { providePracticeHint } from '@/ai/flows/provide-practice-hint';
import { CourseTutor } from './CourseTutor';
import { AILearningClassroom } from './AILearningClassroom';
import { TranslationBar } from '@/components/classroom/TranslationBar';
// Removed direct import - using API route instead
import ReactMarkdown from 'react-markdown';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useEffect, useMemo } from 'react';
import { CodeWorkspace } from '@/components/courses/CodeWorkspace';
import {
  getProjectCodeConfig,
  isProgrammingCourse,
} from '@/lib/programming-course';

type PracticeResult = {
  isCorrect: boolean;
  hint?: string;
  isChecking: boolean;
};

export function LessonContent({
  course,
  lesson,
  autoStartAi = true,
}: {
  course: Course;
  lesson: Lesson;
  /** When false, skips automatic AI guide + tutor calls on mount (e.g. homepage demo). */
  autoStartAi?: boolean;
}) {
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<number, PracticeResult>>({});
  
  const [submissionText, setSubmissionText] = useState('');
  const [codeSubmission, setCodeSubmission] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionFileDataUri, setSubmissionFileDataUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<EvaluateSubmittedTaskOutput | null>(null);

  // Sequential learning state
  const [currentPhase, setCurrentPhase] = useState<'introduction' | 'practice' | 'assessment'>('introduction');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [learningGuide, setLearningGuide] = useState<any>(null);
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);
  const [introText, setIntroText] = useState(lesson.introduction.text);

  const { toast } = useToast();

  const isProgramming = isProgrammingCourse(course);
  const codeProjectConfig = useMemo(
    () => (isProgramming ? getProjectCodeConfig(course, lesson.project) : null),
    [course, lesson.project, isProgramming]
  );

  useEffect(() => {
    if (autoStartAi) {
      generateLearningGuide('introduction');
    }
  }, [autoStartAi]);

  // Sequential learning functions
  const updateLearningProgress = async (newPhase?: 'introduction' | 'practice' | 'assessment') => {
    const targetPhase = newPhase || currentPhase;
    const newProgress = targetPhase === 'introduction' ? 25 : targetPhase === 'practice' ? 60 : 100;
    
    setCurrentPhase(targetPhase);
    setOverallProgress(newProgress);
    setPhaseProgress(0);
    
    // Generate learning guide for the new phase
    await generateLearningGuide(targetPhase);
  };

  const generateLearningGuide = async (phase: 'introduction' | 'practice' | 'assessment') => {
    setIsLoadingGuide(true);
    try {
      const response = await fetch('/api/ai/sequential-learning-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPhase: phase,
          lessonProgress: overallProgress,
          phaseProgress: phaseProgress,
          timeSpent: 0, // Could be tracked more precisely
          engagementLevel: 'medium', // Could be determined dynamically
          lessonContext: {
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            introduction: {
              text: lesson.introduction.text,
            }
          },
          courseContext: {
            title: course.title,
            description: course.description,
            lessons: course.lessons.map((l: any) => ({id: l.id, title: l.title, duration: l.duration})),
          },
          completedActivities: completedActivities,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate learning guide');
      }

      const guide = await response.json();
      setLearningGuide(guide);
    } catch (error) {
      console.error('Error generating learning guide:', error);
    } finally {
      setIsLoadingGuide(false);
    }
  };

  const completeActivity = (activityName: string) => {
    setCompletedActivities(prev => [...prev, activityName]);
    setPhaseProgress(prev => Math.min(prev + 20, 100));
    
    // Check if phase is complete
    if (phaseProgress >= 80) {
      const nextPhase = currentPhase === 'introduction' ? 'practice' : 
                       currentPhase === 'practice' ? 'assessment' : null;
      if (nextPhase) {
        setTimeout(() => updateLearningProgress(nextPhase), 1000);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setSubmissionFileDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePracticeCheck = async (questionIndex: number, quiz: Quiz) => {
    const question = quiz.questions[questionIndex];
    const userAnswer = practiceAnswers[questionIndex];
    const isCorrect = userAnswer === question.correctAnswer;

    setPracticeResults({ ...practiceResults, [questionIndex]: { isCorrect, isChecking: true } });

    if (isCorrect) {
      setPracticeResults(prev => ({ ...prev, [questionIndex]: { isCorrect: true, isChecking: false } }));
      toast({
        title: 'Correct!',
        description: 'Great job, you got it right.',
      });
    } else {
      try {
        const hintResult = await providePracticeHint({
          question: question.question,
          incorrectAnswer: userAnswer,
          correctAnswer: question.correctAnswer
        });
        setPracticeResults(prev => ({ ...prev, [questionIndex]: { isCorrect: false, hint: hintResult.hint, isChecking: false } }));
         toast({
          title: 'Not quite!',
          description: "Here's a hint to help you out.",
          variant: 'destructive',
        });
      } catch (error) {
        console.error('Error getting hint:', error);
        setPracticeResults(prev => ({ ...prev, [questionIndex]: { isCorrect: false, hint: "Could not load a hint, please try again.", isChecking: false } }));
        toast({
            title: 'Error',
            description: 'Could not get a hint from the AI mentor.',
            variant: 'destructive',
        });
      }
    }
  };

  const handleProjectSubmit = async () => {
    const codeBody = codeProjectConfig ? codeSubmission.trim() : '';
    const textBody = submissionText.trim();
    if (codeProjectConfig && !codeBody && !textBody && !submissionFile) {
      toast({
        title: 'Submission is empty',
        description: 'Write your code in the editor or add notes before submitting.',
        variant: 'destructive',
      });
      return;
    }
    if (!codeProjectConfig && !textBody && !submissionFile) {
        toast({ title: 'Submission is empty', description: 'Please provide your work before submitting.', variant: 'destructive' });
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
              : undefined,
        });
        setFeedback(result);
        toast({ title: 'Feedback Received', description: 'Your project has been evaluated by our AI coach.' });
    } catch(error) {
        console.error('Error evaluating task:', error);
        toast({ title: 'Evaluation Error', description: 'Could not get feedback from AI. Please try again.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderQuiz = (quiz: Quiz) => (
    <div className="space-y-12">
      {quiz.questions.map((q, i) => (
        <div key={i}>
          <p className="text-sm text-muted-foreground">Question {i + 1} of {quiz.questions.length}</p>
          <h3 className="text-xl font-semibold mt-1 mb-6">{q.question}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {q.options.map((option, j) => {
               const isSelected = practiceAnswers[i] === option;
               return (
                <div
                  key={j}
                  className={cn(
                    "rounded-lg border p-4 cursor-pointer flex items-center gap-4",
                    isSelected && "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => setPracticeAnswers({ ...practiceAnswers, [i]: option })}
                >
                  <div className={cn(
                    "h-6 w-6 rounded-full border flex items-center justify-center shrink-0",
                     isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"
                  )}>
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <Label htmlFor={`q${i}-opt${j}`} className="font-normal cursor-pointer flex-1">{option}</Label>
                </div>
               )
            })}
          </div>

          <div className='mt-6 flex flex-col items-start gap-4'>
            <Button onClick={() => handlePracticeCheck(i, quiz)} disabled={!practiceAnswers[i] || practiceResults[i]?.isChecking}>
              {practiceResults[i]?.isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Answer
            </Button>
            {practiceResults[i]?.isCorrect === true && <Alert variant="default" className="lesson-alert-success"><CheckCircle2 className="h-4 w-4" /><AlertTitle>Correct</AlertTitle><AlertDescription>Excellent work!</AlertDescription></Alert>}
            {practiceResults[i]?.isCorrect === false && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Not Quite Right</AlertTitle>
                <AlertDescription>
                  {practiceResults[i]?.hint ? (
                     <>AI Hint: {practiceResults[i]?.hint}</>
                  ) : (
                    `The correct answer is: ${q.correctAnswer}`
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="lesson-page w-full">
    <Tabs defaultValue="introduction" className="w-full">
      <div className="mb-4 overflow-x-auto pb-2 sm:mb-0 sm:overflow-visible sm:pb-0">
      <TabsList className="inline-flex h-auto min-h-[2.85rem] min-w-max gap-1 rounded-[var(--radius)] border border-border bg-surface-muted-deep p-1.5 shadow-[0_2px_12px_rgb(0_11_88/0.04)] sm:grid sm:w-full sm:grid-cols-5">
        <TabsTrigger
          value="introduction"
          className="relative min-w-[122px] rounded-[calc(var(--radius)-12px)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:!bg-white data-[state=active]:!text-foreground data-[state=active]:shadow-[0_1px_6px_rgb(0_11_88/0.08)] sm:min-w-0"
        >
          <div className="flex items-center gap-2">
            <span>AI Guide</span>
            {currentPhase === 'introduction' && <div className="lesson-phase-dot" />}
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="practice"
          className="relative min-w-[108px] rounded-[calc(var(--radius)-12px)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:!bg-white data-[state=active]:!text-foreground data-[state=active]:shadow-[0_1px_6px_rgb(0_11_88/0.08)] sm:min-w-0"
        >
          <div className="flex items-center gap-2">
            <span>Practice</span>
            {currentPhase === 'practice' && <div className="lesson-phase-dot" />}
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="project"
          className="relative min-w-[104px] rounded-[calc(var(--radius)-12px)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:!bg-white data-[state=active]:!text-foreground data-[state=active]:shadow-[0_1px_6px_rgb(0_11_88/0.08)] sm:min-w-0"
        >
          <div className="flex items-center gap-2">
            <span>Project</span>
            {currentPhase === 'practice' && <div className="lesson-phase-dot" />}
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="assessment"
          className="relative min-w-[126px] rounded-[calc(var(--radius)-12px)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:!bg-white data-[state=active]:!text-foreground data-[state=active]:shadow-[0_1px_6px_rgb(0_11_88/0.08)] sm:min-w-0"
        >
          <div className="flex items-center gap-2">
            <span>Assessment</span>
            {currentPhase === 'assessment' && <div className="lesson-phase-dot" />}
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="classroom"
          className="min-w-[132px] rounded-[calc(var(--radius)-12px)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:!bg-white data-[state=active]:!text-foreground data-[state=active]:shadow-[0_1px_6px_rgb(0_11_88/0.08)] sm:min-w-0"
        >
          <div className="flex items-center gap-2">
            <span>AI Classroom</span>
          </div>
        </TabsTrigger>
      </TabsList>
      </div>
      <TabsContent value="introduction" className="mt-6">
        {/* Learning Progress Indicator */}
        <LessonPanel className="mb-6">
          <LessonPanelHeader className="pb-3">
            <span className="stat-card-label">Learning progress</span>
            <p className="stat-card-value mt-1">{overallProgress}%</p>
            <div className="lesson-progress-track mt-3 w-full">
              <div
                className="lesson-progress-fill"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </LessonPanelHeader>
          <LessonPanelContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold sm:text-sm',
                    currentPhase === 'introduction'
                      ? 'bg-midnight text-white shadow-[0_2px_8px_rgb(0_11_88/0.15)]'
                      : 'bg-surface-muted-deep text-muted-foreground'
                  )}
                >
                  <span>1. Introduction</span>
                  {currentPhase === 'introduction' && <div className="lesson-phase-dot" />}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold sm:text-sm',
                    currentPhase === 'practice'
                      ? 'bg-midnight text-white shadow-[0_2px_8px_rgb(0_11_88/0.15)]'
                      : 'bg-surface-muted-deep text-muted-foreground'
                  )}
                >
                  <span>2. Practice</span>
                  {currentPhase === 'practice' && <div className="lesson-phase-dot" />}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold sm:text-sm',
                    currentPhase === 'assessment'
                      ? 'bg-midnight text-white shadow-[0_2px_8px_rgb(0_11_88/0.15)]'
                      : 'bg-surface-muted-deep text-muted-foreground'
                  )}
                >
                  <span>3. Assessment</span>
                  {currentPhase === 'assessment' && <div className="lesson-phase-dot" />}
                </div>
            </div>
              {currentPhase !== 'introduction' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={() => updateLearningProgress('introduction')}
                >
                  Back to Introduction
                </Button>
              )}
            </div>
          </LessonPanelContent>
        </LessonPanel>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <LessonPanel className="">
            <LessonPanelHeader>
              <LessonPanelTitle>AI-Guided Introduction</LessonPanelTitle>
              <LessonPanelDescription>Let our AI tutor guide you through this lesson</LessonPanelDescription>
            </LessonPanelHeader>
            <LessonPanelContent className="space-y-6">
              <TranslationBar text={lesson.introduction.text} onTranslated={setIntroText} />
              <div className="prose dark:prose-invert max-w-none">
                <p>{introText}</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-[calc(var(--radius)-8px)] border border-border bg-surface-muted-deep p-4 sm:p-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    AI Learning Assistant
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Need help understanding this concept? Our AI tutor can explain it in different ways, provide examples, or answer your questions.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border text-primary"
                      onClick={() => {
                        // Scroll to the AI tutor and trigger a message
                        const tutorElement = document.querySelector('[data-ai-tutor]');
                        if (tutorElement) {
                          tutorElement.scrollIntoView({ behavior: 'smooth' });
                          // Trigger a message to the AI tutor
                          setTimeout(() => {
                            const event = new CustomEvent('ai-tutor-message', { 
                              detail: { message: 'Can you explain this lesson concept in simple terms?' }
                            });
                            window.dispatchEvent(event);
                          }, 500);
                        }
                      }}
                    >
                      Explain Simply
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border text-primary"
                      onClick={() => {
                        const tutorElement = document.querySelector('[data-ai-tutor]');
                        if (tutorElement) {
                          tutorElement.scrollIntoView({ behavior: 'smooth' });
                          setTimeout(() => {
                            const event = new CustomEvent('ai-tutor-message', { 
                              detail: { message: 'Can you provide practical examples of this concept?' }
                            });
                            window.dispatchEvent(event);
                          }, 500);
                        }
                      }}
                    >
                      Give Examples
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border text-primary"
                      onClick={() => {
                        const tutorElement = document.querySelector('[data-ai-tutor]');
                        if (tutorElement) {
                          tutorElement.scrollIntoView({ behavior: 'smooth' });
                          setTimeout(() => {
                            const event = new CustomEvent('ai-tutor-message', { 
                              detail: { message: 'What questions should I ask to better understand this topic?' }
                            });
                            window.dispatchEvent(event);
                          }, 500);
                        }
                      }}
                    >
                      Ask Questions
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-[calc(var(--radius)-8px)] border border-border bg-surface-muted-deep p-4 sm:p-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-flare" />
                    Learning Checkpoint
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test your understanding before moving to practice questions.
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-primary/25 text-primary hover:bg-primary/5"
                      onClick={() => {
                        completeActivity('understanding-check');
                        // Also trigger AI interaction for understanding check
                        const tutorElement = document.querySelector('[data-ai-tutor]');
                        if (tutorElement) {
                          tutorElement.scrollIntoView({ behavior: 'smooth' });
                          setTimeout(() => {
                            const event = new CustomEvent('ai-tutor-message', { 
                              detail: { message: 'Can you help me test my understanding of this lesson? Please ask me some questions to check if I understand the key concepts.' }
                            });
                            window.dispatchEvent(event);
                          }, 500);
                        }
                      }}
                    >
                      Quick Check
                    </Button>
                    {currentPhase === 'introduction' && phaseProgress >= 60 && (
                      <Button
                        size="sm"
                        className="w-full brand-button-flare"
                        onClick={() => updateLearningProgress('practice')}
                      >
                        Ready for Practice? →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </LessonPanelContent>
          </LessonPanel>
          
          <LessonPanel className="">
            <LessonPanelHeader>
              <LessonPanelTitle>Interactive Learning</LessonPanelTitle>
              <LessonPanelDescription>Engage with AI-powered learning tools</LessonPanelDescription>
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
      </TabsContent>
      <TabsContent value="practice" className="mt-6">
        {currentPhase === 'practice' && (
          <LessonPanel className=" mb-6">
            <LessonPanelHeader>
              <LessonPanelTitle className="flex items-center gap-2">
                <span>🎯 Practice Phase</span>
                <div className="lesson-phase-dot" />
              </LessonPanelTitle>
              <LessonPanelDescription>
                Great job! Now let's apply what you've learned with hands-on practice.
              </LessonPanelDescription>
            </LessonPanelHeader>
            <LessonPanelContent>
              <div className="rounded-[calc(var(--radius)-8px)] border border-border bg-surface-muted-deep p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  💡 <strong className="text-foreground">Practice Tips:</strong> Take your time with each question. If you get stuck, use the AI hints!
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => completeActivity('practice-started')}
                  >
                    Start Practice
                  </Button>
                  {phaseProgress >= 60 && (
                    <Button 
                      size="sm"
                      onClick={() => updateLearningProgress('assessment')}
                    >
                      Ready for Assessment? →
                    </Button>
                  )}
                </div>
              </div>
            </LessonPanelContent>
          </LessonPanel>
        )}
        
        <LessonPanel className="">
          <LessonPanelHeader>
            <LessonPanelTitle>Practice Questions</LessonPanelTitle>
            <LessonPanelDescription>Test your knowledge with these practice questions.</LessonPanelDescription>
          </LessonPanelHeader>
          <LessonPanelContent>
            {renderQuiz(lesson.practice)}
          </LessonPanelContent>
        </LessonPanel>
      </TabsContent>
      <TabsContent value="project" className="mt-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div>
                <LessonPanel className="">
                    <LessonPanelHeader>
                        <LessonPanelTitle>{lesson.project.title}</LessonPanelTitle>
                        <LessonPanelDescription>{lesson.project.description}</LessonPanelDescription>
                        {isProgramming && (
                          <p className="text-xs text-primary font-medium mt-1">
                            Programming course — use the code editor below to submit your solution.
                          </p>
                        )}
                    </LessonPanelHeader>
                    <LessonPanelContent className="space-y-4">
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
                           <Label htmlFor="file-upload">
                             {isProgramming ? 'Attach file (optional)' : 'Upload File'}
                           </Label>
                           <Input 
                             id="file-upload" 
                             type="file" 
                             onChange={handleFileChange}
                             accept={isProgramming ? '.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt,.js,.jsx,.ts,.tsx,.py,.html,.css' : '.pdf,.doc,.docx,.png,.jpg,.jpeg'}
                           />
                           {submissionFile && (
                             <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-primary" />
                                <span>{submissionFile.name}</span>
                             </div>
                           )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="submission-text">
                            {isProgramming ? 'Notes for reviewer (optional)' : 'Or add text / comments'}
                          </Label>
                          <Textarea 
                              id="submission-text"
                              placeholder={isProgramming ? 'Explain your approach, link a repo, or ask specific questions...' : 'Paste code, write notes, or add comments here...'} 
                              className="min-h-[100px] sm:min-h-[120px]"
                              value={submissionText}
                              onChange={(e) => setSubmissionText(e.target.value)}
                          />
                        </div>
                    </LessonPanelContent>
                    <LessonPanelFooter>
                        <Button onClick={handleProjectSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Submit for AI Feedback
                        </Button>
                    </LessonPanelFooter>
                </LessonPanel>
            </div>
            <div>
                <LessonPanel className=" min-h-[340px] sm:min-h-[400px]">
                    <LessonPanelHeader>
                        <LessonPanelTitle>AI Feedback</LessonPanelTitle>
                        <LessonPanelDescription>Your evaluation will appear here.</LessonPanelDescription>
                    </LessonPanelHeader>
                    <LessonPanelContent>
                        {isSubmitting && <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /><span>Evaluating...</span></div>}
                        {!isSubmitting && !feedback && (
                          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <FileUp className="h-12 w-12 mb-2" />
                            <p>Submit your project to get started.</p>
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
                                <AlertTitle>Summary of Mistakes</AlertTitle>
                                <AlertDescription>
                                    <div className="prose dark:prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{feedback.summaryOfMistakes}</ReactMarkdown>
                                    </div>
                                </AlertDescription>
                               </Alert>
                                <Alert>
                                <AlertTitle>Suggestions for Improvement</AlertTitle>
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
        </div>
      </TabsContent>
      <TabsContent value="assessment" className="mt-6">
        {currentPhase === 'assessment' && (
          <LessonPanel className=" mb-6">
            <LessonPanelHeader>
              <LessonPanelTitle className="flex items-center gap-2">
                <span>🏆 Final Assessment</span>
                <div className="lesson-phase-dot" />
              </LessonPanelTitle>
              <LessonPanelDescription>
                Excellent work! Now let's test your mastery of the concepts.
              </LessonPanelDescription>
            </LessonPanelHeader>
            <LessonPanelContent>
              <div className="rounded-[calc(var(--radius)-8px)] border border-border bg-surface-muted-deep p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  🎯 <strong className="text-foreground">Assessment Tips:</strong> This is your chance to demonstrate your understanding. Take your time and think through each question carefully.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => completeActivity('assessment-started')}
                  >
                    Start Assessment
                  </Button>
                  {phaseProgress >= 80 && (
                    <div className="flex items-center gap-2 text-flare">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Lesson Complete! 🎉</span>
                    </div>
                  )}
                </div>
              </div>
            </LessonPanelContent>
          </LessonPanel>
        )}
        
         <LessonPanel className="">
          <LessonPanelHeader>
            <LessonPanelTitle>Module Assessment</LessonPanelTitle>
            <LessonPanelDescription>Show what you've learned in this final assessment.</LessonPanelDescription>
          </LessonPanelHeader>
          <LessonPanelContent>
            {renderQuiz(lesson.assessment)}
            </LessonPanelContent>
        </LessonPanel>
      </TabsContent>
      
      <TabsContent value="classroom" className="mt-6">
        <AILearningClassroom course={course} lesson={lesson} />
      </TabsContent>
    </Tabs>
    </div>
  );
}

    
