'use client';

import { useMemo, useState } from 'react';
import type { Quiz } from '@/lib/data-provider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Result = {
  isCorrect: boolean;
  hint?: string;
};

export function InteractiveQuizPlayer({
  quiz,
  mode,
  passThreshold = 0.6,
  onComplete,
}: {
  quiz: Quiz;
  mode: 'practice' | 'assessment';
  passThreshold?: number;
  onComplete: (result: { score: number; passed: boolean; correct: number; total: number }) => void;
}) {
  const { toast } = useToast();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, Result>>({});
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = quiz.questions[index];
  const total = quiz.questions.length;
  const answeredCount = Object.keys(results).length;
  const correctCount = useMemo(
    () => Object.values(results).filter((r) => r.isCorrect).length,
    [results]
  );
  const progressPct = Math.round(((index + (results[index] ? 1 : 0)) / total) * 100);

  const checkCurrent = async () => {
    if (!question || !answers[index] || results[index]) return;
    setChecking(true);
    const isCorrect = answers[index] === question.correctAnswer;
    let hint: string | undefined;

    if (!isCorrect && mode === 'practice') {
      try {
        const { providePracticeHint } = await import('@/ai/flows/provide-practice-hint');
        const hintResult = await providePracticeHint({
          question: question.question,
          incorrectAnswer: answers[index],
          correctAnswer: question.correctAnswer,
        });
        hint = hintResult.hint;
      } catch {
        hint = `Correct answer: ${question.correctAnswer}`;
      }
    }

    setResults((prev) => ({ ...prev, [index]: { isCorrect, hint } }));
    setChecking(false);
    toast({
      title: isCorrect ? 'Correct!' : 'Not quite',
      description: isCorrect
        ? 'Nice — keep going.'
        : mode === 'practice'
          ? 'Check the hint, then continue.'
          : `The correct answer is: ${question.correctAnswer}`,
      variant: isCorrect ? 'default' : 'destructive',
    });
  };

  const goNext = () => {
    if (index < total - 1) {
      setIndex((i) => i + 1);
      return;
    }
    const tally = quiz.questions.reduce((sum, _, i) => sum + (results[i]?.isCorrect ? 1 : 0), 0);
    const score = Math.round((tally / total) * 100);
    const passed = tally / total >= passThreshold;
    setFinished(true);
    onComplete({ score, passed, correct: tally, total });
  };

  if (finished) {
    const tally = quiz.questions.reduce((sum, _, i) => sum + (results[i]?.isCorrect ? 1 : 0), 0);
    const score = Math.round((tally / total) * 100);
    const passed = tally / total >= passThreshold;
    return (
      <div className="space-y-4 rounded-[var(--radius)] border border-border bg-surface-muted-deep p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="font-heading text-xl font-semibold">
          {mode === 'practice' ? 'Practice complete' : 'Assessment complete'}
        </h3>
        <p className="text-3xl font-semibold tabular-nums">{score}%</p>
        <p className="text-sm text-muted-foreground">
          {tally} of {total} correct
          {passed ? ' — you passed this checkpoint.' : ' — review and try again if you want a stronger score.'}
        </p>
      </div>
    );
  }

  if (!question) return null;

  const result = results[index];
  const selected = answers[index];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>
          {answeredCount}/{total} checked · {correctCount} correct
        </span>
      </div>
      <div className="lesson-progress-track w-full">
        <div className="lesson-progress-fill" style={{ width: `${Math.max(progressPct, 8)}%` }} />
      </div>

      <h3 className="font-heading text-xl font-semibold leading-snug">{question.question}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isSelected = selected === option;
          const showCorrect = !!result && option === question.correctAnswer;
          const showWrong = !!result && isSelected && !result.isCorrect;
          return (
            <button
              key={option}
              type="button"
              disabled={!!result}
              onClick={() => setAnswers((prev) => ({ ...prev, [index]: option }))}
              className={cn(
                'rounded-[calc(var(--radius)-8px)] border p-4 text-left transition-colors',
                isSelected && !result && 'border-primary ring-2 ring-primary/30',
                showCorrect && 'border-royal bg-royal/10',
                showWrong && 'border-destructive bg-destructive/10',
                !result && 'hover:bg-surface-muted-deep'
              )}
            >
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                  )}
                >
                  {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="text-sm leading-relaxed">{option}</span>
              </span>
            </button>
          );
        })}
      </div>

      {result?.isCorrect === true && (
        <Alert className="lesson-alert-success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Correct</AlertTitle>
          <AlertDescription>Solid understanding — move to the next question.</AlertDescription>
        </Alert>
      )}
      {result?.isCorrect === false && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not quite</AlertTitle>
          <AlertDescription>
            {result.hint || `Correct answer: ${question.correctAnswer}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-wrap gap-2">
          {!result ? (
            <Button onClick={checkCurrent} disabled={!selected || checking}>
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check answer
            </Button>
          ) : (
            <Button onClick={goNext}>
              {index < total - 1 ? 'Next question' : 'See results'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
