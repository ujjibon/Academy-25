'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GenerateLearningGameOutput } from '@/lib/learning-games';
import {
  CheckCircle2,
  ChevronRight,
  Shuffle,
  XCircle,
} from 'lucide-react';

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

type FinishPayload = { score: number; correct: number; total: number };

export function LearningGamePlayer({
  game,
  onFinish,
  onReplay,
}: {
  game: GenerateLearningGameOutput;
  onFinish: (result: FinishPayload) => void;
  onReplay: () => void;
}) {
  switch (game.gameType) {
    case 'quiz-blitz':
      return <QuizBlitzGame game={game} onFinish={onFinish} onReplay={onReplay} />;
    case 'match-up':
      return <MatchUpGame game={game} onFinish={onFinish} onReplay={onReplay} />;
    case 'true-or-twist':
      return <TrueOrTwistGame game={game} onFinish={onFinish} onReplay={onReplay} />;
    case 'fill-gap':
      return <FillGapGame game={game} onFinish={onFinish} onReplay={onReplay} />;
    case 'scenario':
      return <ScenarioGame game={game} onFinish={onFinish} onReplay={onReplay} />;
    case 'speed-sort':
      return <SpeedSortGame game={game} onFinish={onFinish} onReplay={onReplay} />;
    default:
      return null;
  }
}

function GameShell({
  title,
  progressLabel,
  children,
}: {
  title: string;
  progressLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-[calc(var(--radius)-10px)] border border-border/60 bg-background/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <Badge variant="secondary" className="rounded-full tabular-nums">
          {progressLabel}
        </Badge>
      </div>
      {children}
    </div>
  );
}

function ResultCard({
  score,
  correct,
  total,
  xpReward,
  onReplay,
}: FinishPayload & { xpReward: number; onReplay: () => void }) {
  return (
    <div className="space-y-4 rounded-[calc(var(--radius)-10px)] border border-border/60 bg-surface-muted-deep/50 p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <div>
        <h3 className="font-heading text-xl font-semibold">Game complete</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {correct}/{total} correct · +{xpReward} XP up for grabs
        </p>
      </div>
      <p className="text-4xl font-semibold tabular-nums">{score}%</p>
      <Button onClick={onReplay} variant="outline" className="rounded-full">
        <Shuffle className="mr-2 h-4 w-4" />
        Play again
      </Button>
    </div>
  );
}

function Feedback({
  ok,
  explanation,
}: {
  ok: boolean;
  explanation: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-[calc(var(--radius)-14px)] border px-3 py-2.5 text-sm',
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
          : 'border-destructive/30 bg-destructive/10 text-destructive'
      )}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p>{explanation}</p>
    </div>
  );
}

function QuizBlitzGame({
  game,
  onFinish,
  onReplay,
}: {
  game: GenerateLearningGameOutput;
  onFinish: (r: FinishPayload) => void;
  onReplay: () => void;
}) {
  const items = game.quizItems;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const item = items[index];

  if (!item || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No quiz items generated.</p>;
  }

  if (done) {
    const score = Math.round((correct / items.length) * 100);
    return (
      <ResultCard
        score={score}
        correct={correct}
        total={items.length}
        xpReward={game.xpReward}
        onReplay={onReplay}
      />
    );
  }

  const revealed = selected !== null;
  const isCorrect = selected === item.correctAnswer;

  const advance = () => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    if (index >= items.length - 1) {
      setCorrect(nextCorrect);
      setDone(true);
      onFinish({
        score: Math.round((nextCorrect / items.length) * 100),
        correct: nextCorrect,
        total: items.length,
      });
      return;
    }
    setCorrect(nextCorrect);
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <GameShell title={game.title} progressLabel={`${index + 1} / ${items.length}`}>
      <p className="text-base font-medium leading-relaxed">{item.question}</p>
      <div className="grid gap-2">
        {item.options.map((option) => {
          const picked = selected === option;
          const showCorrect = revealed && option === item.correctAnswer;
          const showWrong = revealed && picked && option !== item.correctAnswer;
          return (
            <button
              key={option}
              type="button"
              disabled={revealed}
              onClick={() => setSelected(option)}
              className={cn(
                'rounded-[calc(var(--radius)-14px)] border px-4 py-3 text-left text-sm transition-colors',
                !revealed && 'hover:border-primary/40 hover:bg-primary/5',
                showCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                showWrong && 'border-destructive/50 bg-destructive/10',
                picked && !revealed && 'border-primary bg-primary/10'
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {revealed ? <Feedback ok={isCorrect} explanation={item.explanation} /> : null}
      <div className="flex justify-end">
        {!revealed ? null : (
          <Button onClick={advance} className="brand-button rounded-full">
            {index >= items.length - 1 ? 'See results' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </GameShell>
  );
}

function TrueOrTwistGame({
  game,
  onFinish,
  onReplay,
}: {
  game: GenerateLearningGameOutput;
  onFinish: (r: FinishPayload) => void;
  onReplay: () => void;
}) {
  const items = game.trueFalseItems;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const item = items[index];

  if (!item || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No true/false items generated.</p>;
  }

  if (done) {
    const score = Math.round((correct / items.length) * 100);
    return (
      <ResultCard
        score={score}
        correct={correct}
        total={items.length}
        xpReward={game.xpReward}
        onReplay={onReplay}
      />
    );
  }

  const revealed = picked !== null;
  const isCorrect = picked === item.isTrue;

  const advance = () => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    if (index >= items.length - 1) {
      setCorrect(nextCorrect);
      setDone(true);
      onFinish({
        score: Math.round((nextCorrect / items.length) * 100),
        correct: nextCorrect,
        total: items.length,
      });
      return;
    }
    setCorrect(nextCorrect);
    setIndex((i) => i + 1);
    setPicked(null);
  };

  return (
    <GameShell title={game.title} progressLabel={`${index + 1} / ${items.length}`}>
      <p className="text-base font-medium leading-relaxed">{item.statement}</p>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            type="button"
            disabled={revealed}
            onClick={() => setPicked(value)}
            className={cn(
              'rounded-[calc(var(--radius)-14px)] border px-4 py-3 text-sm font-medium transition-colors',
              !revealed && 'hover:border-primary/40 hover:bg-primary/5',
              revealed && value === item.isTrue && 'border-emerald-500/50 bg-emerald-500/10',
              revealed && picked === value && value !== item.isTrue && 'border-destructive/50 bg-destructive/10',
              picked === value && !revealed && 'border-primary bg-primary/10'
            )}
          >
            {value ? 'True' : 'Twist'}
          </button>
        ))}
      </div>
      {revealed ? <Feedback ok={isCorrect} explanation={item.explanation} /> : null}
      {revealed ? (
        <div className="flex justify-end">
          <Button onClick={advance} className="brand-button rounded-full">
            {index >= items.length - 1 ? 'See results' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </GameShell>
  );
}

function FillGapGame({
  game,
  onFinish,
  onReplay,
}: {
  game: GenerateLearningGameOutput;
  onFinish: (r: FinishPayload) => void;
  onReplay: () => void;
}) {
  const items = game.fillGaps;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const item = items[index];

  const choices = useMemo(() => {
    if (!item) return [];
    return shuffle([item.answer, ...item.distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffle when question changes
  }, [index, item?.answer]);

  if (!item || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No fill-gap items generated.</p>;
  }

  if (done) {
    const score = Math.round((correct / items.length) * 100);
    return (
      <ResultCard
        score={score}
        correct={correct}
        total={items.length}
        xpReward={game.xpReward}
        onReplay={onReplay}
      />
    );
  }

  const revealed = selected !== null;
  const isCorrect = selected === item.answer;

  const advance = () => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    if (index >= items.length - 1) {
      setCorrect(nextCorrect);
      setDone(true);
      onFinish({
        score: Math.round((nextCorrect / items.length) * 100),
        correct: nextCorrect,
        total: items.length,
      });
      return;
    }
    setCorrect(nextCorrect);
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <GameShell title={game.title} progressLabel={`${index + 1} / ${items.length}`}>
      <p className="text-base font-medium leading-relaxed">{item.sentence}</p>
      <p className="text-xs text-muted-foreground">Hint: {item.hint}</p>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={revealed}
            onClick={() => setSelected(choice)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm transition-colors',
              !revealed && 'hover:border-primary/40 hover:bg-primary/5',
              revealed && choice === item.answer && 'border-emerald-500/50 bg-emerald-500/10',
              revealed && selected === choice && choice !== item.answer && 'border-destructive/50 bg-destructive/10',
              selected === choice && !revealed && 'border-primary bg-primary/10'
            )}
          >
            {choice}
          </button>
        ))}
      </div>
      {revealed ? (
        <Feedback
          ok={isCorrect}
          explanation={isCorrect ? 'Nice fill!' : `Answer: ${item.answer}`}
        />
      ) : null}
      {revealed ? (
        <div className="flex justify-end">
          <Button onClick={advance} className="brand-button rounded-full">
            {index >= items.length - 1 ? 'See results' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </GameShell>
  );
}

function ScenarioGame({
  game,
  onFinish,
  onReplay,
}: {
  game: GenerateLearningGameOutput;
  onFinish: (r: FinishPayload) => void;
  onReplay: () => void;
}) {
  const items = game.scenarios;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const item = items[index];

  if (!item || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No scenarios generated.</p>;
  }

  if (done) {
    const score = Math.round((correct / items.length) * 100);
    return (
      <ResultCard
        score={score}
        correct={correct}
        total={items.length}
        xpReward={game.xpReward}
        onReplay={onReplay}
      />
    );
  }

  const revealed = selected !== null;
  const isCorrect = selected === item.correctOption;

  const advance = () => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    if (index >= items.length - 1) {
      setCorrect(nextCorrect);
      setDone(true);
      onFinish({
        score: Math.round((nextCorrect / items.length) * 100),
        correct: nextCorrect,
        total: items.length,
      });
      return;
    }
    setCorrect(nextCorrect);
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <GameShell title={game.title} progressLabel={`${index + 1} / ${items.length}`}>
      <p className="text-sm text-muted-foreground">You walk into this situation…</p>
      <p className="text-base font-medium leading-relaxed">{item.situation}</p>
      <div className="grid gap-2">
        {item.options.map((option) => {
          const picked = selected === option;
          const showCorrect = revealed && option === item.correctOption;
          const showWrong = revealed && picked && option !== item.correctOption;
          return (
            <button
              key={option}
              type="button"
              disabled={revealed}
              onClick={() => setSelected(option)}
              className={cn(
                'rounded-[calc(var(--radius)-14px)] border px-4 py-3 text-left text-sm transition-colors',
                !revealed && 'hover:border-primary/40 hover:bg-primary/5',
                showCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                showWrong && 'border-destructive/50 bg-destructive/10',
                picked && !revealed && 'border-primary bg-primary/10'
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {revealed ? <Feedback ok={isCorrect} explanation={item.explanation} /> : null}
      {revealed ? (
        <div className="flex justify-end">
          <Button onClick={advance} className="brand-button rounded-full">
            {index >= items.length - 1 ? 'See results' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </GameShell>
  );
}

function MatchUpGame({
  game,
  onFinish,
  onReplay,
}: {
  game: GenerateLearningGameOutput;
  onFinish: (r: FinishPayload) => void;
  onReplay: () => void;
}) {
  const pairs = game.matchPairs;
  const terms = useMemo(() => shuffle(pairs.map((p) => p.term)), [pairs]);
  const definitions = useMemo(() => shuffle(pairs.map((p) => p.definition)), [pairs]);
  const lookup = useMemo(
    () => Object.fromEntries(pairs.map((p) => [p.term, p.definition])),
    [pairs]
  );

  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [flashWrong, setFlashWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (pairs.length === 0) {
    return <p className="text-sm text-muted-foreground">No match pairs generated.</p>;
  }

  if (done) {
    const correct = pairs.length;
    const total = pairs.length + mistakes;
    const score = Math.max(0, Math.round((correct / Math.max(total, 1)) * 100));
    return (
      <ResultCard
        score={score}
        correct={correct}
        total={pairs.length}
        xpReward={game.xpReward}
        onReplay={onReplay}
      />
    );
  }

  const usedDefs = new Set(Object.values(matched));

  const tryMatch = (definition: string) => {
    if (!selectedTerm || usedDefs.has(definition)) return;
    if (lookup[selectedTerm] === definition) {
      const next = { ...matched, [selectedTerm]: definition };
      setMatched(next);
      setSelectedTerm(null);
      if (Object.keys(next).length === pairs.length) {
        setDone(true);
        const totalAttempts = pairs.length + mistakes;
        onFinish({
          score: Math.max(0, Math.round((pairs.length / Math.max(totalAttempts, 1)) * 100)),
          correct: pairs.length,
          total: pairs.length,
        });
      }
      return;
    }
    setMistakes((m) => m + 1);
    setFlashWrong(definition);
    window.setTimeout(() => setFlashWrong(null), 450);
  };

  return (
    <GameShell
      title={game.title}
      progressLabel={`${Object.keys(matched).length} / ${pairs.length} matched`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Terms
          </p>
          {terms.map((term) => {
            const isMatched = Boolean(matched[term]);
            return (
              <button
                key={term}
                type="button"
                disabled={isMatched}
                onClick={() => setSelectedTerm(term)}
                className={cn(
                  'w-full rounded-[calc(var(--radius)-14px)] border px-3 py-2.5 text-left text-sm transition-colors',
                  isMatched && 'opacity-40',
                  selectedTerm === term && 'border-primary bg-primary/10',
                  !isMatched && selectedTerm !== term && 'hover:border-primary/40'
                )}
              >
                {term}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Definitions
          </p>
          {definitions.map((definition) => {
            const isUsed = usedDefs.has(definition);
            return (
              <button
                key={definition}
                type="button"
                disabled={isUsed || !selectedTerm}
                onClick={() => tryMatch(definition)}
                className={cn(
                  'w-full rounded-[calc(var(--radius)-14px)] border px-3 py-2.5 text-left text-sm transition-colors',
                  isUsed && 'opacity-40',
                  flashWrong === definition && 'border-destructive/50 bg-destructive/10',
                  !isUsed && selectedTerm && 'hover:border-primary/40'
                )}
              >
                {definition}
              </button>
            );
          })}
        </div>
      </div>
      {mistakes > 0 ? (
        <p className="text-xs text-muted-foreground">{mistakes} miss{mistakes === 1 ? '' : 'es'}</p>
      ) : null}
    </GameShell>
  );
}

function SpeedSortGame({
  game,
  onFinish,
  onReplay,
}: {
  game: GenerateLearningGameOutput;
  onFinish: (r: FinishPayload) => void;
  onReplay: () => void;
}) {
  const items = useMemo(() => shuffle(game.sortItems), [game.sortItems]);
  const buckets = game.sortBuckets;
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; label: string } | null>(null);
  const [done, setDone] = useState(false);
  const item = items[index];

  if (!item || items.length === 0 || buckets.length === 0) {
    return <p className="text-sm text-muted-foreground">No sort items generated.</p>;
  }

  if (done) {
    const score = Math.round((correct / items.length) * 100);
    return (
      <ResultCard
        score={score}
        correct={correct}
        total={items.length}
        xpReward={game.xpReward}
        onReplay={onReplay}
      />
    );
  }

  const pickBucket = (bucketId: string) => {
    if (feedback) return;
    const ok = bucketId === item.correctBucketId;
    const label =
      buckets.find((b) => b.id === item.correctBucketId)?.label || item.correctBucketId;
    setFeedback({ ok, label });
    const nextCorrect = correct + (ok ? 1 : 0);
    window.setTimeout(() => {
      if (index >= items.length - 1) {
        setCorrect(nextCorrect);
        setDone(true);
        onFinish({
          score: Math.round((nextCorrect / items.length) * 100),
          correct: nextCorrect,
          total: items.length,
        });
        return;
      }
      setCorrect(nextCorrect);
      setIndex((i) => i + 1);
      setFeedback(null);
    }, 700);
  };

  return (
    <GameShell title={game.title} progressLabel={`${index + 1} / ${items.length}`}>
      <p className="text-center text-lg font-semibold leading-snug">{item.text}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {buckets.map((bucket) => (
          <button
            key={bucket.id}
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => pickBucket(bucket.id)}
            className={cn(
              'rounded-[calc(var(--radius)-14px)] border px-4 py-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5',
              feedback &&
                bucket.id === item.correctBucketId &&
                'border-emerald-500/50 bg-emerald-500/10',
              feedback &&
                !feedback.ok &&
                feedback.label !== bucket.label &&
                'opacity-60'
            )}
          >
            {bucket.label}
          </button>
        ))}
      </div>
      {feedback ? (
        <Feedback
          ok={feedback.ok}
          explanation={
            feedback.ok ? 'Sorted!' : `Belongs in “${feedback.label}”.`
          }
        />
      ) : null}
    </GameShell>
  );
}
