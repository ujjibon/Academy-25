'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, AudioLines, Braces, Camera, Check, CheckCircle2, ChevronRight, CircleHelp, Columns3, GitBranch, Layers, ListOrdered, Palette, Play, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Table2, Type, Workflow, X } from 'lucide-react';
import type { Course, Lesson } from '@/lib/data-provider';
import { applyGameAction, buildLearningGamePlan, createGameState, evaluateGame, gameKindLabels, type GameAction, type GameChallenge, type GameKind, type GameState } from '@/lib/learning-game-catalog';
import { DistinctGameBoardsA } from './DistinctGameBoardsA';
import { DistinctGameBoardsB } from './DistinctGameBoardsB';
import type { LearningPlayFamily, LearningPlayPose } from './LearningPlayScene';
import { cn } from '@/lib/utils';

const LearningPlayScene = dynamic(() => import('./LearningPlayScene').then(module => module.LearningPlayScene), { ssr: false });
export type LearningPlayGameProps = { course: Course; lesson: Lesson; active?: boolean; onComplete?: (score: number) => void };
type Attempt = { state: GameState; submitted: boolean; completed: boolean; attempts: number; points: number };
const boardA = new Set<GameKind>(['code', 'branch', 'loop', 'sort', 'lookup', 'grid', 'layout', 'contrast', 'chart']);
const icons = { code: Braces, branch: GitBranch, loop: Workflow, sort: ListOrdered, lookup: Search, grid: Columns3, layout: Layers, contrast: Palette, timeline: SlidersHorizontal, mix: AudioLines, caption: Type, camera: Camera, evidence: ShieldCheck, claim: GitBranch, query: Search, budget: Layers, sequence: Workflow, chart: Table2 };
const families: Record<GameKind, LearningPlayFamily> = { code: 'code', branch: 'code', loop: 'code', sort: 'code', lookup: 'code', grid: 'design', layout: 'design', contrast: 'design', timeline: 'video', mix: 'video', caption: 'video', camera: 'creative', evidence: 'research', claim: 'research', query: 'research', budget: 'prompt', sequence: 'code', chart: 'creative' };
const newAttempt = (challenge: GameChallenge): Attempt => ({ state: createGameState(challenge), submitted: false, completed: false, attempts: 0, points: 0 });

/** The sculpture follows player state; each board owns its own simulation. */
function sculpturePoses(challenge: GameChallenge, state: GameState): LearningPlayPose[] {
  const values = Object.values(state.numbers).filter(Number.isFinite);
  return challenge.items.slice(0, 3).map((item, index) => {
    const slot = state.order.indexOf(item.id);
    const group = state.groups[item.id];
    const selected = state.selected.includes(item.id);
    const value = values[index % Math.max(1, values.length)] ?? 0;
    const normalized = Math.atan(value / 10) / Math.PI + .5;
    return { id: item.id, x: group ? ['true', 'keep', 'credible'].includes(group) ? .78 : .24 : slot >= 0 ? (slot + 1) / (state.order.length + 1) : .2 + index * .3, y: values.length ? .2 + normalized * .6 : selected ? .3 : .65, rotation: values.length ? value / 40 : slot >= 0 ? slot * .18 : 0, scale: .15 + normalized * .2, placed: selected || slot >= 0 || !!group };
  });
}

function PlaySession({ course, lesson, active = true, onComplete }: LearningPlayGameProps) {
  const plan = useMemo(() => buildLearningGamePlan(course, lesson), [course, lesson]);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>(() => plan.challenges.map(newAttempt));
  const [hint, setHint] = useState(false);
  const [visible, setVisible] = useState(true);
  const reported = useRef(false);
  const challenge = plan.challenges[index];
  const attempt = attempts[index];
  const result = evaluateGame(challenge, attempt.state);
  const playable = active && visible;
  const complete = attempts.every(item => item.completed);
  const mastered = attempts.filter(item => item.completed).length;
  const points = attempts.reduce((total, item) => total + item.points, 0);
  const KindIcon = icons[challenge.kind];
  const poses = useMemo(() => sculpturePoses(challenge, attempt.state), [challenge, attempt.state]);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (complete && !reported.current) { reported.current = true; onComplete?.(100); }
  }, [complete, onComplete]);

  const change = (action: GameAction) => {
    if (!playable || document.hidden || attempt.completed) return;
    setAttempts(previous => previous.map((item, position) => position === index ? { ...item, state: applyGameAction(challenge, item.state, action), submitted: false } : item));
  };
  const submit = () => {
    if (!playable || document.hidden || attempt.completed) return;
    setAttempts(previous => previous.map((item, position) => position === index ? { ...item, submitted: true, attempts: item.attempts + 1, completed: result.passed, points: result.passed ? Math.max(60, 100 - item.attempts * 10) : 0 } : item));
  };
  const reset = () => {
    if (!playable) return;
    setAttempts(previous => previous.map((item, position) => position === index ? newAttempt(challenge) : item));
    setHint(false);
  };
  const switchChallenge = (next: number) => { if (playable) { setIndex(next); setHint(false); } };
  const boardProps = { challenge, state: attempt.state, change, result, active: playable && !attempt.completed };
  const outcome = attempt.completed ? 'success' : attempt.submitted ? 'retry' : 'playing';

  return <section aria-label="Playable learning game" data-learning-games="distinct" data-current-game={challenge.kind} data-game-outcome={outcome} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-[#20242b]">
    <header className="flex flex-wrap items-start justify-between gap-3 px-4 pb-4 pt-5 sm:px-6">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Your lesson playground</p><h3 className="mt-1 text-xl font-semibold tracking-tight">{plan.title}</h3><p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">Three ways to try the idea. Choose an activity, experiment, and check what changed.</p></div>
      <div className="flex shrink-0 items-center gap-3"><span className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm font-semibold tabular-nums">{points}<span className="ml-1.5 text-[9px] font-medium text-slate-400">PTS</span></span><span className="text-xs text-slate-500">{mastered}/{plan.challenges.length} mastered</span></div>
    </header>
    <div role="tablist" aria-label="Games in this lesson" className="mx-3 grid grid-cols-3 gap-2 sm:mx-5">
      {plan.challenges.map((item, position) => {
        const Icon = icons[item.kind];
        return <button key={item.id} role="tab" id={'game-tab-' + item.id} aria-selected={index === position} aria-controls={'game-panel-' + item.id} tabIndex={index === position ? 0 : -1} onClick={() => switchChallenge(position)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? plan.challenges.length - 1 : (position + (event.key === 'ArrowLeft' ? -1 : 1) + plan.challenges.length) % plan.challenges.length;
          switchChallenge(next); document.getElementById('game-tab-' + plan.challenges[next].id)?.focus();
        }} className={cn('flex min-w-0 items-start gap-2 rounded-xl border p-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#335cff] sm:p-3', index === position ? 'border-[#335cff]/50 bg-[#335cff]/5' : 'border-slate-200 hover:bg-slate-50')}>
          <span className={cn('mt-0.5 shrink-0', attempts[position].completed || index === position ? 'text-[#335cff]' : 'text-slate-400')}>{attempts[position].completed ? <CheckCircle2 className="size-4"/> : <Icon className="size-4"/>}</span>
          <span className="min-w-0"><span className="block text-[10px] text-slate-500">0{position + 1}</span><span className="mt-0.5 block text-[11px] font-semibold leading-snug sm:text-xs">{gameKindLabels[item.kind]}</span></span>
        </button>;
      })}
    </div>

    <div role="tabpanel" id={'game-panel-' + challenge.id} aria-labelledby={'game-tab-' + challenge.id} className="pt-5">
      <div className="flex items-start justify-between gap-3 px-4 sm:px-6"><div><div className="flex items-center gap-2"><KindIcon className="size-4 shrink-0 text-[#335cff]"/><h4 className="text-base font-semibold tracking-tight">{challenge.title}</h4></div><p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-600">{challenge.brief}</p></div><button onClick={reset} disabled={!playable} aria-label="Reset this activity" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#335cff] disabled:opacity-40"><RotateCcw className="size-3.5"/></button></div>
      <div className="mx-3 mt-3 grid min-w-0 gap-4 rounded-xl bg-[#fafbfe] p-3 sm:mx-5 sm:p-4 xl:grid-cols-[minmax(0,1fr)_210px]">
        <div className="min-w-0"><p className="mb-3 text-[11px] leading-relaxed text-slate-500">{challenge.instruction}</p><fieldset disabled={!playable || attempt.completed} className="min-w-0">{boardA.has(challenge.kind) ? <DistinctGameBoardsA key={challenge.id} {...boardProps}/> : <DistinctGameBoardsB key={challenge.id} {...boardProps}/>}</fieldset></div>
        <aside className="min-w-0 self-start rounded-xl border border-slate-200 bg-white p-3" aria-label="Live experiment result">
          <div className="flex items-center gap-3 xl:block"><LearningPlayScene family={families[challenge.kind]} round={index} progress={result.progress} outcome={outcome} active={playable} poses={poses} className="h-[95px] w-[120px] shrink-0 rounded-lg xl:h-[140px] xl:w-full"/><div className="min-w-0 xl:mt-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live result</p><p data-game-output className="mt-1.5 break-words whitespace-pre-line font-mono text-[11px] leading-relaxed text-slate-700">{result.output}</p></div></div>
          <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">{result.checks.map((check, position) => <li key={position + '-' + check.label} className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-500"><span className={cn('mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full', check.passed ? 'bg-[#335cff]/10 text-[#335cff]' : 'border border-slate-200')}>{check.passed && <Check className="size-2.5"/>}</span>{check.label}</li>)}</ul>
        </aside>
      </div>
      <div className="mx-4 mt-4 rounded-xl border border-slate-100 px-3 py-2.5 sm:mx-6"><p className="text-[10px] font-semibold text-[#335cff]">What this teaches</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{challenge.connection}</p></div>
      {hint && <div className="mx-4 mt-3 rounded-xl border border-[#335cff]/20 bg-[#335cff]/4 p-3 sm:mx-6"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold text-[#335cff]">Try this</p><button aria-label="Close activity hint" onClick={() => setHint(false)}><X className="size-3.5 text-slate-400"/></button></div><p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">{challenge.hint}</p></div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="flex min-w-0 flex-1 items-start gap-2"><button onClick={() => setHint(value => !value)} aria-expanded={hint} aria-label="Show activity hint" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#335cff]"><CircleHelp className="size-4"/></button><p aria-live="polite" data-game-feedback className={cn('max-w-xl pt-1 text-[11px] leading-relaxed', attempt.completed ? 'font-semibold text-[#335cff]' : attempt.submitted ? 'text-[#a45622]' : 'text-slate-500')}>{attempt.submitted || attempt.completed ? result.feedback : 'Change a control and watch the result. Check your work when you are ready.'}</p></div>{attempt.completed ? complete ? <span className="flex items-center gap-2 rounded-lg bg-[#335cff]/6 px-3 py-2.5 text-xs font-semibold text-[#335cff]"><CheckCircle2 className="size-4"/>Lesson playground mastered</span> : <button onClick={() => switchChallenge(attempts.findIndex(item => !item.completed))} className="flex items-center gap-2 rounded-lg bg-[#335cff] px-4 py-2.5 text-xs font-semibold text-white">Try another game<ChevronRight className="size-3.5"/></button> : <button onClick={submit} disabled={!playable} className="flex items-center gap-2 rounded-lg bg-[#335cff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#244bf0] disabled:opacity-40"><Play className="size-3 fill-current"/>{challenge.action}</button>}</footer>
    </div>
    {complete && <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6"><ArrowRight className="mt-0.5 size-3.5 shrink-0 text-[#335cff]"/><p className="text-[11px] leading-relaxed text-slate-600">You tried the idea in three different ways. Watch the sketch film, then apply it in <span className="font-medium">{plan.projectTitle}</span>.</p></div>}
  </section>;
}

export function LearningPlayGame(props: LearningPlayGameProps) { return <PlaySession key={props.course.id + ':' + props.lesson.id} {...props}/>; }
