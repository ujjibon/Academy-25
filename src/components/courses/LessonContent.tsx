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
import ReactMarkdown from 'react-markdown';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';

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

  const { toast } = useToast();

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
                    "rounded-lg border p-4 cursor-pointer transition-all flex items-center gap-4",
                    isSelected && "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background",
                    "hover:border-primary/80"
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
        <TabsTrigger value="introduction">Introduction</TabsTrigger>
        <TabsTrigger value="practice">Practice</TabsTrigger>
        <TabsTrigger value="project">Project</TabsTrigger>
        <TabsTrigger value="assessment">Assessment</TabsTrigger>
        <TabsTrigger value="ai-teacher">AI Teacher</TabsTrigger>
      </TabsList>
      <TabsContent value="introduction" className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="aspect-video mb-6">
              <iframe
                className="w-full h-full rounded-lg"
                src={lesson.introduction.videoUrl}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p>{lesson.introduction.text}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="practice" className="mt-6">
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
       <TabsContent value="ai-teacher" className="mt-6">
        <Card>
            <CardHeader>
                <CardTitle>AI Teacher</CardTitle>
                <CardDescription>Your personal tutor for the "{course.title}" course.</CardDescription>
            </CardHeader>
            <CardContent>
                <CourseTutor course={course} />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

    