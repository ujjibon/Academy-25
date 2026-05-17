'use client';
import { useState } from 'react';
import type { Lesson, Course, Quiz } from '@/lib/data-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
// Removed direct import - using API route instead
import ReactMarkdown from 'react-markdown';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

type PracticeResult = {
  isCorrect: boolean;
  hint?: string;
  isChecking: boolean;
};

export function LessonContent({ course, lesson }: { course: Course; lesson: Lesson }) {
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<number, PracticeResult>>({});
  
  const [submissionText, setSubmissionText] = useState('');
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

  const { toast } = useToast();

  // Initialize learning guide on component mount
  useEffect(() => {
    generateLearningGuide('introduction');
  }, []);

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
    if (!submissionText && !submissionFile) {
        toast({ title: 'Submission is empty', description: 'Please provide your work before submitting.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
        const result = await evaluateSubmittedTask({
            taskDescription: lesson.project.description,
            submissionText: submissionText,
            submissionFile: submissionFileDataUri || undefined,
            studentLevel: 'beginner',
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
            {practiceResults[i]?.isCorrect === true && <Alert variant="default" className="border-green-500 text-green-700 dark:border-green-500 dark:text-green-400"><CheckCircle2 className="h-4 w-4 !text-green-700 dark:!text-green-400" /><AlertTitle>Correct</AlertTitle><AlertDescription>Excellent work!</AlertDescription></Alert>}
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
    <Tabs defaultValue="introduction" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="introduction" className={cn(
          "relative",
          currentPhase === 'introduction' && "bg-primary text-primary-foreground"
        )}>
          <div className="flex items-center gap-2">
            <span>AI Guide</span>
            {currentPhase === 'introduction' && <div className="w-2 h-2 bg-green-500 rounded-full " />}
          </div>
        </TabsTrigger>
        <TabsTrigger value="practice" className={cn(
          "relative",
          currentPhase === 'practice' && "bg-primary text-primary-foreground"
        )}>
          <div className="flex items-center gap-2">
            <span>Practice</span>
            {currentPhase === 'practice' && <div className="w-2 h-2 bg-green-500 rounded-full " />}
          </div>
        </TabsTrigger>
        <TabsTrigger value="project" className={cn(
          "relative",
          currentPhase === 'practice' && "bg-primary text-primary-foreground"
        )}>
          <div className="flex items-center gap-2">
            <span>Project</span>
            {currentPhase === 'practice' && <div className="w-2 h-2 bg-green-500 rounded-full " />}
          </div>
        </TabsTrigger>
        <TabsTrigger value="assessment" className={cn(
          "relative",
          currentPhase === 'assessment' && "bg-primary text-primary-foreground"
        )}>
          <div className="flex items-center gap-2">
            <span>Assessment</span>
            {currentPhase === 'assessment' && <div className="w-2 h-2 bg-green-500 rounded-full " />}
          </div>
        </TabsTrigger>
        <TabsTrigger value="classroom">
          <div className="flex items-center gap-2">
            <span>AI Classroom</span>
          </div>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="introduction" className="mt-6">
        {/* Learning Progress Indicator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Learning Progress</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                  currentPhase === 'introduction' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <span>1. Introduction</span>
                  {currentPhase === 'introduction' && <div className="w-2 h-2 bg-green-500 rounded-full " />}
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                  currentPhase === 'practice' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <span>2. Practice</span>
                  {currentPhase === 'practice' && <div className="w-2 h-2 bg-green-500 rounded-full " />}
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                  currentPhase === 'assessment' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <span>3. Assessment</span>
                  {currentPhase === 'assessment' && <div className="w-2 h-2 bg-green-500 rounded-full " />}
                </div>
            </div>
              {currentPhase !== 'introduction' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => updateLearningProgress('introduction')}
                >
                  Back to Introduction
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>AI-Guided Introduction</CardTitle>
              <CardDescription>Let our AI tutor guide you through this lesson</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <p>{lesson.introduction.text}</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Learning Assistant
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    Need help understanding this concept? Our AI tutor can explain it in different ways, provide examples, or answer your questions.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
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
                      className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
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
                      className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
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
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Learning Checkpoint
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                    Test your understanding before moving to practice questions.
                  </p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300 w-full"
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
                        className="w-full bg-green-600"
                        onClick={() => updateLearningProgress('practice')}
                      >
                        Ready for Practice? →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Interactive Learning</CardTitle>
              <CardDescription>Engage with AI-powered learning tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div data-ai-tutor>
                <CourseTutor course={course} currentLesson={lesson} />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="practice" className="mt-6">
        {currentPhase === 'practice' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯 Practice Phase</span>
                <div className="w-2 h-2 bg-green-500 rounded-full " />
              </CardTitle>
              <CardDescription>
                Great job! Now let's apply what you've learned with hands-on practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  💡 <strong>Practice Tips:</strong> Take your time with each question. If you get stuck, use the AI hints!
                </p>
                <div className="flex gap-2">
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
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Practice Questions</CardTitle>
            <CardDescription>Test your knowledge with these practice questions.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderQuiz(lesson.practice)}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="project" className="mt-6">
        <div className="grid lg:grid-cols-2 gap-8">
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>{lesson.project.title}</CardTitle>
                        <CardDescription>{lesson.project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="file-upload">Upload File</Label>
                           <Input 
                             id="file-upload" 
                             type="file" 
                             onChange={handleFileChange}
                             accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                           />
                           {submissionFile && (
                             <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-green-500" />
                                <span>{submissionFile.name}</span>
                             </div>
                           )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="submission-text">Or add text / comments</Label>
                          <Textarea 
                              id="submission-text"
                              placeholder="Paste code, write notes, or add comments here..." 
                              className="min-h-[150px]"
                              value={submissionText}
                              onChange={(e) => setSubmissionText(e.target.value)}
                          />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleProjectSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Submit for AI Feedback
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div>
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>AI Feedback</CardTitle>
                        <CardDescription>Your evaluation will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </div>
        </div>
      </TabsContent>
      <TabsContent value="assessment" className="mt-6">
        {currentPhase === 'assessment' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆 Final Assessment</span>
                <div className="w-2 h-2 bg-green-500 rounded-full " />
              </CardTitle>
              <CardDescription>
                Excellent work! Now let's test your mastery of the concepts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                  🎯 <strong>Assessment Tips:</strong> This is your chance to demonstrate your understanding. Take your time and think through each question carefully.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => completeActivity('assessment-started')}
                  >
                    Start Assessment
                  </Button>
                  {phaseProgress >= 80 && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Lesson Complete! 🎉</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
         <Card>
          <CardHeader>
            <CardTitle>Module Assessment</CardTitle>
            <CardDescription>Show what you've learned in this final assessment.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderQuiz(lesson.assessment)}
            </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="classroom" className="mt-6">
        <AILearningClassroom course={course} lesson={lesson} />
      </TabsContent>
    </Tabs>
  );
}

    