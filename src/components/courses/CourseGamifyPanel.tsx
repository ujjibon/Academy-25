'use client';

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { getCourse } from '@/lib/data-provider';
import { buildCurriculumGame, type GameDifficulty } from '@/lib/curriculum-games';
import { readQuestProgress, recordGameCompletion } from '@/lib/quest-progress';
import { validateGeneratedLearningGame, LEARNING_GAME_TYPES, type GenerateLearningGameOutput, type LearningGameType } from '@/lib/learning-games';
import { LearningGamePlayer, type GameFinishResult } from '@/components/courses/LearningGamePlayer';
import { ArrowRight, Brain, Check, Compass, Gamepad2, Layers, Loader2, Shuffle, Sparkles, Target, Zap } from 'lucide-react';

const GAME_META: Record<LearningGameType, { label: string; description: string; icon: ComponentType<{ className?: string }>; color: string; tag: string }> = {
  'quiz-blitz': { label: 'Checkpoint sprint', description: 'Collect discoveries with every answer.', icon: Zap, color: 'coral', tag: 'Recall' },
  'match-up': { label: 'Memory bridges', description: 'Connect ideas and build stronger recall.', icon: Layers, color: 'teal', tag: 'Connect' },
  'true-or-twist': { label: 'Myth detective', description: 'Investigate claims. Find the hidden twist.', icon: Brain, color: 'violet', tag: 'Investigate' },
  'fill-gap': { label: 'Knowledge repair', description: 'Restore the missing piece of a concept.', icon: Target, color: 'teal', tag: 'Reconstruct' },
  scenario: { label: 'Decision trail', description: 'Choose a move and see why it works.', icon: Gamepad2, color: 'coral', tag: 'Apply' },
  'speed-sort': { label: 'Concept compass', description: 'Find the right home for every idea.', icon: Compass, color: 'violet', tag: 'Organize' },
};

function checkpointCount(game: GenerateLearningGameOutput | null) {
  if (!game) return 0;
  const groups = { 'quiz-blitz': game.quizItems, 'match-up': game.matchPairs, 'true-or-twist': game.trueFalseItems, 'fill-gap': game.fillGaps, scenario: game.scenarios, 'speed-sort': game.sortItems };
  return groups[game.gameType].length;
}

export function CourseGamifyPanel({ courseId, courseTitle, courseDescription, lessonTitles, initialLessonId }: {
  courseId: string; courseTitle: string; courseDescription: string; lessonTitles: string[]; initialLessonId?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const course = useMemo(() => getCourse(courseId), [courseId]);
  const [gameType, setGameType] = useState<LearningGameType>('quiz-blitz');
  const [topicFocus, setTopicFocus] = useState(() => course?.lessons.some(lesson => lesson.id === initialLessonId) ? initialLessonId! : 'all');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [generating, setGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<GenerateLearningGameOutput | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [rewardStatus, setRewardStatus] = useState('');
  const finished = useRef(false);
  const requestInFlight = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => { requestRef.current?.abort(); requestRef.current = null; }, []);
  const curriculumGame = useMemo(() => buildCurriculumGame(courseId, gameType, difficulty, topicFocus), [courseId, gameType, difficulty, topicFocus]);
  const game = generatedGame || curriculumGame;
  const source = generatedGame ? 'Fresh remix' : 'Lesson challenge';
  const topicTitle = course?.lessons.find(lesson => lesson.id === topicFocus)?.title;

  const resetRun = () => {
    finished.current = false;
    setRewardStatus('');
    setPlayerKey(value => value + 1);
  };
  const chooseType = (type: LearningGameType) => { setGameType(type); setGeneratedGame(null); resetRun(); };

  const generate = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 70000);
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-learning-game', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ courseId, lessonId: topicFocus === 'all' ? undefined : topicFocus, courseTitle, courseDescription, lessonTitles, topicFocus: topicTitle, gameType, difficulty }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Could not prepare the requested challenge.');
      const result = validateGeneratedLearningGame(payload, gameType);
      if (result.gameType !== gameType || checkpointCount(result) === 0) throw new Error('This remix did not include a playable challenge. Please try again.');
      setGeneratedGame(result);
      resetRun();
      toast({ title: 'Your new challenge is ready', description: `${result.title} · ${checkpointCount(result)} checkpoints` });
    } catch {
      if (requestRef.current === controller) toast({ title: 'This remix is not ready yet', description: controller.signal.aborted ? 'This challenge is taking a little longer. Keep playing your lesson challenge and try a remix again.' : 'We could not prepare this remix. Your lesson challenge is still ready to play; try again in a moment.', variant: 'destructive' });
    } finally {
      window.clearTimeout(timeout);
      requestInFlight.current = false;
      if (requestRef.current === controller) { requestRef.current = null; setGenerating(false); }
    }
  };

  const handleFinish = (result: GameFinishResult) => {
    if (finished.current || !game) return;
    finished.current = true;
    const accountId = user?.uid || 'guest';
    const gameKey = `${game.gameType}:${difficulty}`;
    try {
      const previous = readQuestProgress(accountId, courseId, topicFocus).gameScores[gameKey] || 0;
      const saved = recordGameCompletion(accountId, courseId, topicFocus, gameKey, result.score, game.xpReward);
      if (saved) {
        setRewardStatus(`+${game.xpReward} expedition XP saved on this device. Your first mastery of this challenge is complete.`);
        toast({ title: 'Expedition mastered', description: `+${game.xpReward} expedition XP · progress saved on this device` });
      } else if (previous >= 70) {
        setRewardStatus('Mastery already saved on this device. Replay to sharpen your skills; rewards are earned once per lesson, format, and difficulty.');
      } else if (result.score < 70) {
        setRewardStatus('Reach 70% to master this challenge. Review your discoveries below, then try again.');
      } else {
        setRewardStatus('Mastery reached, but this device could not save your progress. No XP was recorded.');
      }
    } catch {
      setRewardStatus('Mastery reached, but this device could not save your progress. No XP was recorded.');
    }
  };

  return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-3xl border border-orange-100 bg-[#fff6ef] p-6 dark:border-orange-900/40 dark:bg-orange-950/20 sm:p-7">
      <div aria-hidden="true" className="absolute -right-6 -top-8 h-36 w-36 rounded-full border-[22px] border-orange-200/50 dark:border-orange-800/30" />
      <div className="relative max-w-xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-800 dark:text-orange-300"><Gamepad2 className="h-4 w-4" />The game arcade</div><h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Little games. Lasting discoveries.</h2><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Play your way through {courseTitle}. Six ways to practice, with explanations that turn every choice into learning.</p><div className="mt-4 flex flex-wrap gap-2"><Badge className="rounded-full border-0 bg-white text-teal-800 dark:bg-slate-800 dark:text-teal-200">Ready to play</Badge><Badge className="rounded-full border-0 bg-white text-orange-800 dark:bg-slate-800 dark:text-orange-200">No timer pressure</Badge><Badge className="rounded-full border-0 bg-white text-violet-800 dark:bg-slate-800 dark:text-violet-200">70% = mastery</Badge></div></div>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Choose a game format">
      {LEARNING_GAME_TYPES.map(type => {
        const meta = GAME_META[type]; const Icon = meta.icon; const active = gameType === type;
        const count = checkpointCount(buildCurriculumGame(courseId, type, difficulty, topicFocus));
        const color = meta.color === 'coral' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200' : meta.color === 'teal' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200';
        return <button key={type} type="button" aria-pressed={active} disabled={generating} onClick={() => chooseType(type)} className={cn('relative flex flex-col rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 motion-reduce:transition-none', active ? 'border-teal-500 bg-[#f1faf7] shadow-sm dark:bg-teal-950/30' : 'border-slate-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900')}>{active && <span className="absolute right-3 top-3 rounded-full bg-teal-700 p-1 text-white"><Check className="h-3 w-3" /><span className="sr-only">Selected</span></span>}<div className="flex items-center gap-3"><span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}><Icon className="h-5 w-5" /></span><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{meta.tag}</span></div><h3 className="mt-3 font-heading text-sm font-bold text-slate-900 dark:text-white">{meta.label}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{meta.description}</p><p className="mt-3 text-[11px] font-semibold text-teal-700 dark:text-teal-300">{count ? `${count} lesson checkpoints` : 'Create a remix'}<ArrowRight className="ml-1 inline h-3 w-3" /></p></button>;
      })}
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 space-y-2 sm:min-w-[180px]"><label id={`game-topic-${courseId}`} className="text-xs font-semibold text-slate-600 dark:text-slate-300">Your learning trail</label><Select value={topicFocus} disabled={generating} onValueChange={value => { setTopicFocus(value); setGeneratedGame(null); resetRun(); }}><SelectTrigger aria-labelledby={`game-topic-${courseId}`} className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Whole course</SelectItem>{course?.lessons.map(lesson => <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2 sm:w-44"><label id={`game-difficulty-${courseId}`} className="text-xs font-semibold text-slate-600 dark:text-slate-300">Challenge level</label><Select value={difficulty} disabled={generating} onValueChange={value => { setDifficulty(value as GameDifficulty); setGeneratedGame(null); resetRun(); }}><SelectTrigger aria-labelledby={`game-difficulty-${courseId}`} className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="easy">Explorer · practice</SelectItem><SelectItem value="medium">Adventurer · mixed</SelectItem><SelectItem value="hard">Trailblazer · assessment</SelectItem></SelectContent></Select></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="rounded-full" disabled={generating} onClick={() => { const pool = LEARNING_GAME_TYPES.filter(type => type !== gameType); chooseType(pool[Math.floor(Math.random() * pool.length)]); }}><Shuffle className="mr-2 h-4 w-4" />Surprise me</Button><Button type="button" className="rounded-full bg-violet-700 text-white hover:bg-violet-800" disabled={generating} onClick={() => void generate()}>{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{generating ? 'Preparing challenge…' : 'Create a remix'}</Button></div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Your lesson challenge follows course checkpoints. Create a remix for fresh discoveries on the same learning trail.</p>
    </div>

    {generating && <p role="status" className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300"><Loader2 className="h-4 w-4 animate-spin" />Preparing your next expedition. Your lesson challenge stays ready to play.</p>}
    {game ? <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-full border-teal-200 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200">{source}</Badge><span className="text-xs text-slate-500 dark:text-slate-400">{checkpointCount(game)} checkpoints · ~{game.estimatedMinutes} min · {game.xpReward} expedition XP on first mastery</span></div>{generatedGame && <Button variant="ghost" size="sm" disabled={generating} onClick={() => { setGeneratedGame(null); resetRun(); }} className="rounded-full text-teal-700 dark:text-teal-300">Back to lesson challenge</Button>}</div>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{game.instructions}</p>
      <LearningGamePlayer key={`${courseId}-${topicFocus}-${difficulty}-${gameType}-${playerKey}`} game={game} onFinish={handleFinish} onReplay={resetRun} rewardStatus={rewardStatus} />
      <p className="text-xs text-slate-500 dark:text-slate-400">Expedition progress is saved on this device for {user ? 'your account' : 'guest play'}. Replay freely; each lesson, format, and level awards XP once.</p>
    </div> : <div role="status" className="rounded-2xl border border-dashed border-slate-300 bg-[#faf9f5] p-6 text-center dark:bg-slate-900"><Gamepad2 className="mx-auto h-8 w-8 text-teal-700" /><h3 className="mt-3 font-semibold">This trail needs its first checkpoint.</h3><p className="mt-2 text-sm text-slate-500">Choose another lesson or create a fresh remix for this learning trail.</p></div>}
  </div>;
}
