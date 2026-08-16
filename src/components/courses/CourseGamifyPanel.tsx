'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addXP } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  LEARNING_GAME_TYPES,
  type GenerateLearningGameOutput,
  type LearningGameType,
} from '@/lib/learning-games';
import { LearningGamePlayer } from '@/components/courses/LearningGamePlayer';
import {
  Brain,
  Gamepad2,
  Layers,
  Loader2,
  Shuffle,
  Sparkles,
  Target,
  Timer,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';

const GAME_META: Record<
  LearningGameType,
  {
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
  }
> = {
  'quiz-blitz': {
    label: 'Quiz Blitz',
    description: 'Fast multiple-choice rounds with instant explanations.',
    icon: Zap,
  },
  'match-up': {
    label: 'Match Up',
    description: 'Pair terms with the right definitions.',
    icon: Layers,
  },
  'true-or-twist': {
    label: 'True or Twist',
    description: 'Spot facts vs sneaky misconceptions.',
    icon: Brain,
  },
  'fill-gap': {
    label: 'Fill the Gap',
    description: 'Complete key sentences from the course.',
    icon: Target,
  },
  scenario: {
    label: 'Scenario Run',
    description: 'Choose the best move in real situations.',
    icon: Gamepad2,
  },
  'speed-sort': {
    label: 'Speed Sort',
    description: 'Drop concepts into the right buckets fast.',
    icon: Timer,
  },
};

type Difficulty = 'easy' | 'medium' | 'hard';

export function CourseGamifyPanel({
  courseId,
  courseTitle,
  courseDescription,
  lessonTitles,
}: {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  lessonTitles: string[];
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameType, setGameType] = useState<LearningGameType>('quiz-blitz');
  const [topicFocus, setTopicFocus] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [generating, setGenerating] = useState(false);
  const [game, setGame] = useState<GenerateLearningGameOutput | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [awarded, setAwarded] = useState(false);

  const topicOptions = useMemo(
    () => [{ value: 'all', label: 'Whole course' }, ...lessonTitles.map((t) => ({ value: t, label: t }))],
    [lessonTitles]
  );

  const generate = async (type: LearningGameType = gameType) => {
    setGenerating(true);
    setGame(null);
    setAwarded(false);
    try {
      const res = await fetch('/api/ai/generate-learning-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle,
          courseDescription,
          lessonTitles,
          topicFocus: topicFocus === 'all' ? undefined : topicFocus,
          gameType: type,
          difficulty,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }

      const result = (await res.json()) as GenerateLearningGameOutput;
      setGame(result);
      setGameType(result.gameType);
      setPlayerKey((k) => k + 1);
      toast({
        title: 'Game ready',
        description: `${result.title} · ~${result.estimatedMinutes} min · ${result.xpReward} XP`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Could not generate game',
        description: e instanceof Error ? e.message : 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const surprise = () => {
    const pool = LEARNING_GAME_TYPES.filter((t) => t !== gameType);
    const pick = pool[Math.floor(Math.random() * pool.length)] || 'quiz-blitz';
    setGameType(pick);
    void generate(pick);
  };

  const handleFinish = async (result: { score: number; correct: number; total: number }) => {
    if (awarded || !user?.uid || !game) return;
    setAwarded(true);
    const earned = Math.max(
      10,
      Math.round(game.xpReward * Math.min(1, Math.max(0.4, result.score / 100)))
    );
    try {
      await addXP(user.uid, earned);
      toast({
        title: `+${earned} XP`,
        description: `Nice run on ${game.title}.`,
      });
    } catch {
      // XP is optional — game still works offline / unsigned
    }
  };

  return (
    <div className="space-y-6">
      <header className="text-left">
        <h2 className="font-dashboard-title text-xl font-bold tracking-tight sm:text-2xl">
          Gamify learning
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI builds fun mini-games from {courseTitle} topics — play, score, and reinforce what
          you&apos;ve learned.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING_GAME_TYPES.map((type) => {
          const meta = GAME_META[type];
          const Icon = meta.icon;
          const active = gameType === type;
          return (
            <button
              key={type}
              type="button"
              disabled={generating}
              onClick={() => setGameType(type)}
              className={cn(
                'brand-card flex flex-col gap-2 p-4 text-left transition-colors',
                active ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)-14px)] bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-heading text-sm font-semibold">{meta.label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {meta.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-[calc(var(--radius)-10px)] border border-border/60 bg-background/50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Topic focus</label>
          <Select value={topicFocus} onValueChange={setTopicFocus}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Whole course" />
            </SelectTrigger>
            <SelectContent>
              {topicOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[140px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger className="rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={generating}
            onClick={surprise}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Surprise me
          </Button>
          <Button
            type="button"
            className="brand-button rounded-full"
            disabled={generating}
            onClick={() => generate()}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {GAME_META[gameType].label}
              </>
            )}
          </Button>
        </div>
      </div>

      {generating ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[calc(var(--radius)-10px)] border border-dashed border-border py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Crafting a {GAME_META[gameType].label} game…</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Pulling ideas from course lessons{topicFocus !== 'all' ? ` · focus: ${topicFocus}` : ''}.
          </p>
        </div>
      ) : null}

      {!generating && game ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {GAME_META[game.gameType].label}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {game.topicFocus}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ~{game.estimatedMinutes} min · up to {game.xpReward} XP
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{game.instructions}</p>
          <LearningGamePlayer
            key={`${courseId}-${playerKey}`}
            game={game}
            onFinish={handleFinish}
            onReplay={() => {
              setAwarded(false);
              setPlayerKey((k) => k + 1);
            }}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={generating}
              onClick={() => generate(game.gameType)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              New game same style
            </Button>
          </div>
        </div>
      ) : null}

      {!generating && !game ? (
        <div className="rounded-[calc(var(--radius)-10px)] border border-dashed border-border bg-surface-muted-deep/40 px-5 py-10 text-center">
          <Gamepad2 className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-heading text-base font-semibold">Pick a game style and generate</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Each run is unique — AI invents questions, matches, scenarios, and sorts from this
            course&apos;s lessons.
          </p>
        </div>
      ) : null}
    </div>
  );
}
