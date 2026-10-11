'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { arrangeChoices } from '@/lib/curriculum-games';
import type { GenerateLearningGameOutput } from '@/lib/learning-games';
import { Check, CheckCircle2, ChevronRight, Flag, Flame, RotateCcw, Sparkles, Trophy } from 'lucide-react';

export type GameFinishResult = { score: number; correct: number; total: number };
type PlayerProps = {
  game: GenerateLearningGameOutput;
  onFinish: (result: GameFinishResult) => void;
  onReplay: () => void;
  rewardStatus?: string;
};
type Round = { prompt: string; options: string[]; answer: string; explanation: string; hint?: string };

export function LearningGamePlayer(props: PlayerProps) {
  if (props.game.gameType === 'match-up') return <MatchUpGame {...props} />;
  return <CheckpointGame {...props} />;
}

function GameShell({ title, completed, total, combo, correct, children }: {
  title: string; completed: number; total: number; combo: number; correct: number; children: ReactNode;
}) {
  return (
    <section aria-label={title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-[#f9f7f2] px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Practice expedition</p><h3 className="mt-1 font-heading text-lg font-bold text-slate-900 dark:text-white">{title}</h3></div>
          <div className="flex gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" />{combo} combo</span>
            <span>{correct} mastered</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div role="progressbar" aria-label="Challenge progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-teal-500 transition-all motion-reduce:transition-none" style={{ width: `${total ? completed / total * 100 : 0}%` }} />
          </div>
          <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-300">{completed} / {total}</span>
        </div>
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ResultCard({ score, correct, total, bestCombo, review, onReplay, rewardStatus }: GameFinishResult & {
  bestCombo: number; review: Round[]; onReplay: () => void; rewardStatus?: string;
}) {
  const mastered = score >= 70;
  return (
    <section aria-label="Challenge results" className="rounded-3xl border border-teal-200 bg-[#f1faf7] p-6 dark:border-teal-800 dark:bg-teal-950/40">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm dark:bg-teal-900 dark:text-teal-200"><Trophy className="h-8 w-8" /></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">{mastered ? 'Checkpoint mastered' : 'A step closer'}</p><h3 className="mt-2 font-heading text-2xl font-bold text-slate-900 dark:text-white">{mastered ? 'Expedition complete!' : 'Your next win starts here.'}</h3></div>
        <div className="flex flex-wrap justify-center gap-6 py-2 text-slate-700 dark:text-slate-200">
          <div><p className="text-3xl font-bold tabular-nums">{score}%</p><p className="text-xs">mastery</p></div>
          <div><p className="text-3xl font-bold tabular-nums">{correct}/{total}</p><p className="text-xs">first-try correct</p></div>
          <div><p className="text-3xl font-bold tabular-nums">{bestCombo}</p><p className="text-xs">best combo</p></div>
        </div>
        <p role="status" className="text-sm text-teal-800 dark:text-teal-200">{rewardStatus || (mastered ? 'Mastery reached. Saving your progress…' : 'Reach 70% to master this challenge. Review the cards below and try again.')}</p>
        <Button onClick={onReplay} variant="outline" className="rounded-full border-teal-200 bg-white text-teal-900 dark:bg-teal-900 dark:text-white"><RotateCcw className="mr-2 h-4 w-4" />Practice again</Button>
      </div>
      {review.length > 0 && <div className="mt-6 space-y-3 border-t border-teal-200 pt-5 dark:border-teal-800"><h4 className="font-semibold text-slate-900 dark:text-white">Take these discoveries into your next run</h4>{review.map((item, index) => <div key={`${index}-${item.prompt}`} className="rounded-2xl bg-white p-4 text-sm dark:bg-slate-900"><p className="whitespace-pre-line font-medium text-slate-800 dark:text-slate-100">{item.prompt}</p><p className="mt-2 text-teal-800 dark:text-teal-300"><strong>Remember:</strong> {item.answer}</p><p className="mt-1 text-slate-500 dark:text-slate-300">{item.explanation}</p></div>)}</div>}
    </section>
  );
}

function Feedback({ ok, explanation }: { ok: boolean; explanation: string }) {
  return <div role="status" className={cn('flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed', ok ? 'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200' : 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200')}><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">{ok ? 'Connection made!' : 'New discovery — keep going.'}</p><p className="mt-1">{explanation}</p></div></div>;
}

function getRounds(game: GenerateLearningGameOutput): Round[] {
  switch (game.gameType) {
    case 'quiz-blitz': return game.quizItems.map(item => ({ prompt: item.question, options: item.options, answer: item.correctAnswer, explanation: item.explanation }));
    case 'true-or-twist': return game.trueFalseItems.map(item => ({ prompt: item.statement, options: ['True', 'Twist'], answer: item.isTrue ? 'True' : 'Twist', explanation: item.explanation }));
    case 'fill-gap': return game.fillGaps.map(item => ({ prompt: item.sentence, options: arrangeChoices([item.answer, ...item.distractors], item.sentence), answer: item.answer, explanation: item.explanation || `The missing answer is “${item.answer}”.`, hint: item.hint }));
    case 'scenario': return game.scenarios.map(item => ({ prompt: item.situation, options: item.options, answer: item.correctOption, explanation: item.explanation }));
    case 'speed-sort': return arrangeChoices(game.sortItems, game.title).map(item => ({ prompt: item.text, options: game.sortBuckets.map(bucket => bucket.label), answer: game.sortBuckets.find(bucket => bucket.id === item.correctBucketId)?.label || '', explanation: item.explanation || `This card belongs in “${game.sortBuckets.find(bucket => bucket.id === item.correctBucketId)?.label || ''}”.` }));
    default: return [];
  }
}

function getCombos(answers: boolean[]) {
  let current = 0;
  let best = 0;
  answers.forEach(ok => { current = ok ? current + 1 : 0; best = Math.max(best, current); });
  return { current, best };
}

function CheckpointGame({ game, onFinish, onReplay, rewardStatus }: PlayerProps) {
  const rounds = useMemo(() => getRounds(game), [game]);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const index = answers.length;
  const round = rounds[index];
  const correct = answers.filter(Boolean).length;
  const combo = getCombos(answers);

  if (done) return <ResultCard score={Math.round(correct / rounds.length * 100)} correct={correct} total={rounds.length} bestCombo={combo.best} review={rounds.filter((_, itemIndex) => !answers[itemIndex])} onReplay={onReplay} rewardStatus={rewardStatus} />;
  if (!round) return <div role="status" className="rounded-2xl border p-6">This challenge has no checkpoints yet. Choose another lesson or format.</div>;

  const revealed = selected !== null;
  const isCorrect = selected === round.answer;
  const advance = () => {
    if (!revealed || finished.current) return;
    const next = [...answers, isCorrect];
    setAnswers(next);
    setSelected(null);
    if (next.length === rounds.length) {
      finished.current = true;
      setDone(true);
      const nextCorrect = next.filter(Boolean).length;
      onFinish({ score: Math.round(nextCorrect / rounds.length * 100), correct: nextCorrect, total: rounds.length });
    } else {
      requestAnimationFrame(() => headingRef.current?.focus());
    }
  };

  return <GameShell title={game.title} completed={index} total={rounds.length} correct={correct} combo={combo.current}>
    <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300"><Flag className="h-4 w-4" />Checkpoint {index + 1}{game.gameType === 'speed-sort' ? ' · choose a category' : game.gameType === 'scenario' ? ' · choose your next move' : ''}</div>
    <h4 ref={headingRef} tabIndex={-1} className="whitespace-pre-line text-lg font-semibold leading-relaxed text-slate-900 focus:outline-none dark:text-slate-100">{round.prompt}</h4>
    {round.hint && <details className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:bg-violet-950/50 dark:text-violet-200"><summary className="cursor-pointer font-medium">Need a clue?</summary><p className="mt-2">{round.hint}</p></details>}
    <div className={cn('grid gap-3', game.gameType === 'true-or-twist' && 'sm:grid-cols-2')}>
      {[...new Set(round.options)].map((option, optionIndex) => {
        const answer = revealed && option === round.answer;
        const wrong = revealed && option === selected && !answer;
        return <button key={option} type="button" disabled={revealed} aria-pressed={selected === option} onClick={() => setSelected(option)} className={cn('flex min-h-14 items-center gap-3 rounded-2xl border p-4 text-left text-sm leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 motion-reduce:transition-none', answer ? 'border-teal-500 bg-teal-50 text-teal-950 dark:bg-teal-950 dark:text-teal-200' : wrong ? 'border-orange-400 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-200' : 'border-slate-200 bg-white text-slate-700 enabled:hover:border-teal-400 enabled:hover:bg-teal-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:enabled:hover:bg-slate-800')}><span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold', answer ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300')}>{answer ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{wrong && <span className="sr-only">Your choice. Review the explanation below.</span>}</button>;
      })}
    </div>
    {revealed && <Feedback ok={isCorrect} explanation={round.explanation} />}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500 dark:text-slate-400">No timer. Every discovery counts.</p>{revealed && <Button onClick={advance} className="rounded-full bg-teal-700 text-white hover:bg-teal-800">{index === rounds.length - 1 ? 'See my discoveries' : 'Next checkpoint'}<ChevronRight className="ml-1 h-4 w-4" /></Button>}</div>
  </GameShell>;
}

function MatchUpGame({ game, onFinish, onReplay, rewardStatus }: PlayerProps) {
  const pairs = game.matchPairs;
  const terms = useMemo(() => arrangeChoices(pairs, `${game.title}:terms`), [game.title, pairs]);
  const definitions = useMemo(() => arrangeChoices(pairs, `${game.title}:answers`), [game.title, pairs]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; explanation: string } | null>(null);
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const combos = getCombos(attempts);
  const correct = pairs.length - missed.length;
  const review = pairs.filter(pair => missed.includes(pair.term)).map(pair => ({ prompt: pair.term, options: [], answer: pair.definition, explanation: 'Connect this checkpoint to its lesson answer on your next run.' }));
  if (!pairs.length) return <div role="status" className="rounded-2xl border p-6">No matching cards in this lesson yet. Try another format.</div>;
  if (done) return <ResultCard score={Math.round(correct / pairs.length * 100)} correct={correct} total={pairs.length} bestCombo={combos.best} review={review} onReplay={onReplay} rewardStatus={rewardStatus} />;

  const chooseDefinition = (definition: string) => {
    if (!selected || finished.current) return;
    const pair = pairs.find(item => item.term === selected)!;
    const ok = pair.definition === definition;
    setAttempts(previous => [...previous, ok]);
    setFeedback({ ok, explanation: ok ? `${pair.term} → ${pair.definition}` : `A useful connection to remember: ${pair.term} → ${pair.definition}. Try this bridge again.` });
    if (!ok) { setMissed(previous => previous.includes(selected) ? previous : [...previous, selected]); return; }
    const next = [...matched, selected];
    setMatched(next);
    setSelected(null);
    if (next.length === pairs.length) {
      finished.current = true;
      setDone(true);
      onFinish({ score: Math.round(correct / pairs.length * 100), correct, total: pairs.length });
    }
  };

  return <GameShell title={game.title} completed={matched.length} total={pairs.length} correct={matched.filter(term => !missed.includes(term)).length} combo={combos.current}>
    <p className="text-sm text-slate-600 dark:text-slate-300">Build a memory bridge: select a checkpoint, then its lesson answer. Use touch, a mouse, or the Tab and Enter keys.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3"><h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Checkpoints</h4>{terms.map(pair => { const complete = matched.includes(pair.term); return <button key={pair.term} type="button" disabled={complete} aria-pressed={selected === pair.term} onClick={() => { setSelected(pair.term); setFeedback(null); }} className={cn('flex min-h-16 w-full items-center gap-2 rounded-2xl border p-4 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500', complete ? 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200' : selected === pair.term ? 'border-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-950 dark:text-violet-200' : 'border-slate-200 text-slate-700 enabled:hover:border-violet-400 dark:border-slate-700 dark:text-slate-200')}>{complete && <Check className="h-4 w-4 shrink-0" />}{pair.term}</button>; })}</div>
      <div className="space-y-3"><h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Lesson answers</h4>{definitions.map(pair => { const complete = matched.includes(pair.term); return <button key={pair.definition} type="button" disabled={complete || !selected} onClick={() => chooseDefinition(pair.definition)} className={cn('flex min-h-16 w-full items-center gap-2 rounded-2xl border p-4 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500', complete ? 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200' : 'border-slate-200 text-slate-700 disabled:opacity-60 enabled:hover:border-teal-400 dark:border-slate-700 dark:text-slate-200')}>{complete && <Check className="h-4 w-4 shrink-0" />}{pair.definition}</button>; })}</div>
    </div>
    {feedback && <Feedback {...feedback} />}
    <p className="text-xs text-slate-500 dark:text-slate-400"><Sparkles className="mr-1 inline h-3 w-3" />First-try bridges count toward mastery. Practice as often as you like.</p>
  </GameShell>;
}
