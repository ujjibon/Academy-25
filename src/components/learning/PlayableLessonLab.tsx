'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, ChevronRight, Eye, Play, RotateCcw, SlidersHorizontal, Volume2, X } from 'lucide-react';
import type { Course, Lesson } from '@/lib/data-provider';
import { buildLessonLab, createInitialLabState, evaluateLab, placeLabPiece, simulateLab, type LabResult, type LabState, type LessonLab } from '@/lib/lesson-labs';
import { LessonLabScene } from './LessonLabScene';
import { cn } from '@/lib/utils';

export type PlayableLessonLabProps = { course: Course; lesson: Lesson; active?: boolean; onComplete?: (score: number) => void };

function brief(text: string, max = 110) { return text.length > max ? `${text.slice(0, max).trim()}…` : text; }

function MiniaturePreview({ lab, state, playing, time }: { lab: LessonLab; state: LabState; playing: boolean; time: number }) {
  const has = (id: string) => state.slots.includes(id);
  const simulation = simulateLab(lab, state);
  const pieces = state.slots.map(id => lab.pieces.find(item => item.id === id));
  if (lab.family === 'video') {
    const filled = pieces.filter(Boolean);
    const current = Math.min(Math.floor(time / Math.max(1, state.first)), Math.max(0, filled.length - 1));
    const shot = filled[current];
    return <div className="space-y-3">
      <div className="relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl bg-[#2b344b] p-5 text-white">
        <div className="absolute inset-0 opacity-75" style={{ background: `radial-gradient(circle at ${30 + current * 13}% 35%, ${shot?.color || '#6a7a88'}85, transparent 60%)` }} />
        <div className="absolute inset-x-0 top-4 flex justify-between px-4 text-[9px] font-bold uppercase tracking-[0.15em] text-white/65"><span>{playing ? 'Playing your edit' : 'Your edit preview'}</span><span>{time.toFixed(1)} / {filled.length * state.first}s</span></div>
        <div className="relative mb-3 flex items-center justify-center gap-2 py-3"><div className="grid size-14 place-items-center rounded-2xl border border-white/25 bg-white/10 text-3xl">{shot?.symbol || '▶'}</div><ArrowRight className="size-5 text-white/50"/><div className="grid size-20 place-items-center rounded-full border border-white/25 bg-white/10 text-4xl">{current >= 3 ? '✓' : '✧'}</div></div>
        <div className="relative"><p className="text-xs font-semibold text-white/65">{shot?.label || 'Place a shot to start'}</p><p className="mt-1 text-sm font-bold leading-snug">{brief(current === 2 || current === 3 ? lab.contextLines[0] : lab.projectTitle, 100)}</p></div>
        {state.safeguard && <div className="relative mt-3 rounded-md bg-black/65 px-2.5 py-1.5 text-center text-[11px] font-medium">{brief(lab.lessonPrinciple, 96)}</div>}
      </div>
      <div className="flex gap-1" aria-label="Timeline preview">{pieces.map((part, index) => <div key={index} className={cn('flex h-11 min-w-0 flex-1 items-center justify-center rounded-md border-2 px-1 text-center text-[9px] font-bold', current === index && playing ? 'border-[#243d35]' : 'border-transparent')} style={{ backgroundColor: part ? `${part.color}55` : '#edece5' }}>{part?.short || 'Empty'}<br/>{state.first}s</div>)}</div>
      <p className="flex items-center gap-2 text-[10px] text-[#7b8077]"><Volume2 className="size-3.5"/>Music: {state.second}% of the mix · {state.safeguard ? 'Captions visible' : 'Captions off'}</p>
    </div>;
  }
  if (lab.family === 'design') {
    // The target controls the actual text luminance against white: contrast = 1.05/(L + .05).
    const linear = Math.max(0, Math.min(1, 1.05 / state.second - 0.05));
    const srgb = linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
    const channel = Math.floor(srgb * 255);
    const textColor = `rgb(${channel}, ${channel}, ${channel})`;
    return <div className="rounded-2xl border border-[#e0e2d8] bg-white p-4"><div className="mb-3 flex gap-1"><span className="size-1.5 rounded-full bg-[#ed8cac]"/><span className="size-1.5 rounded-full bg-[#efba6c]"/><span className="size-1.5 rounded-full bg-[#89bc86]"/></div><div className="flex flex-col" style={{ gap: state.first, color: textColor }}>{pieces.map((part, index) => {
      if (!part) return <div key={index} className="h-5 rounded bg-[#eeeee8]" />;
      if (part.id === 'heading') return <h4 key={index} className="text-lg font-black leading-tight">{brief(lab.projectTitle, 66)}</h4>;
      if (part.id === 'context') return <p key={index} className="text-xs leading-relaxed">{brief(lab.lessonPrinciple, 130)}</p>;
      if (part.id === 'proof') return <div key={index} className="flex h-14 items-center gap-2 rounded-lg bg-[#eef3eb] px-3"><div className="size-8 rounded-md bg-[#a5bda2]"/><div className="flex-1 space-y-1.5"><div className="h-2 w-3/4 rounded bg-[#bccbbb]"/><div className="h-2 w-1/2 rounded bg-[#d2dacf]"/></div></div>;
      if (part.id === 'action') return <button key={index} className={cn('w-fit rounded-lg bg-[#2d5447] px-4 py-2 text-xs font-bold text-white', state.safeguard && 'outline outline-2 outline-offset-4 outline-[#ce8b41]')} type="button">Try the lesson project</button>;
      return <p key={index} className="text-[10px] leading-relaxed">{brief(part.id === 'noise' ? 'BUY NOW! CLICK HERE! Another competing action!' : lab.contextLines[1] || 'More detail follows the main decision.', 95)}</p>;
    })}</div></div>;
  }
  if (lab.family === 'creative') return <div className="relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl bg-[#303e34] p-5 text-[#fff5db]">
    {state.second > 0 && Array.from({ length: Math.round(state.second) }, (_, index) => <span key={index} className="absolute rounded-full border-2 border-[#efba6c]/60" style={{ width: 12 + index * 5, height: 12 + index * 5, left: `${7 + index * 13}%`, top: `${25 + index % 3 * 20}%`, opacity: 0.6 }} />)}
    {state.safeguard && <div className="pointer-events-none absolute inset-4 rounded-lg border border-dashed border-[#fff5db]/50" />}
    {has('subject') && <div className="absolute top-[20%] grid aspect-square place-items-center rounded-[32%] bg-gradient-to-br from-[#efba6c] via-[#d39a5c] to-[#ab7765] text-[#304438] shadow-lg transition-[width]" style={{ width: `${state.first}%`, right: state.safeguard ? '12%' : '-4%' }}><span className="text-5xl sm:text-6xl">✧</span></div>}
    {has('noise') && <div className="absolute left-0 top-20 size-28 rounded-full bg-[#c299da]/80"/>}
    <div className="relative z-10 mt-auto max-w-[75%]"><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#efba6c]">{has('palette') ? 'One visual language' : 'Palette not connected'}</p><h4 className="text-xl font-black leading-tight">{has('brief') ? brief(lab.projectTitle, 64) : 'What is the message?'}</h4>{has('space') && <p className="mt-3 text-[10px] leading-relaxed text-[#fff5db]/65">{brief(lab.lessonPrinciple, 94)}</p>}</div>
    {has('export') && <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[8px] uppercase tracking-wider">Delivery frame</div>}
  </div>;
  if (lab.family === 'code') return <div className="overflow-hidden rounded-2xl bg-[#26383e] text-[#d8eee6]"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="text-[9px] font-bold uppercase tracking-[0.15em]">Execution console</span><span className="rounded-full bg-[#79b69d]/20 px-2 py-1 text-[9px]">{lab.operation === 'double' ? 'x → x × 2' : lab.operation === 'sort' ? 'sort ascending' : lab.operation === 'uppercase' ? 'text → UPPERCASE' : lab.operation === 'jsx' ? 'labels → components' : 'records → counts'}</span></div><div className="space-y-4 p-4"><div className="flex flex-wrap gap-2">{simulation.values.map((value, index) => <span key={index} className={cn('rounded-md border px-2 py-1 font-mono text-[10px]', typeof value === 'number' && value <= 0 ? 'border-[#dd8d76]/50 bg-[#dd8d76]/15 text-[#f2b09d]' : 'border-white/15 bg-white/5')}>{String(value)}</span>)}</div><div className="space-y-2">{simulation.output.split(' → ').map((line, index) => <p key={index} className="flex gap-2 font-mono text-[10px] leading-relaxed"><span className="text-[#78b4a0]">{index + 1}.</span><span className="break-all">{line}</span></p>)}</div><div className="flex gap-1.5">{Array.from({ length: 3 }, (_, index) => <div key={index} className={cn('flex h-7 flex-1 items-center justify-center rounded text-[8px]', index < state.second ? 'bg-[#8ebba6]/25' : 'bg-white/5')}>Lane {index + 1}</div>)}</div>{state.second > 3 && <p className="text-[10px] text-[#f2b09d]">{state.second - 3} workers have no available lane.</p>}</div></div>;
  if (lab.family === 'research') return <div className="space-y-3"><div className="rounded-xl border border-[#dbe3d0] bg-[#eff3e8] p-4"><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#80926a]">Question board</p><p className="mt-2 text-sm font-bold text-[#44543c]">{has('question') ? brief(lab.projectTitle, 105) : 'Connect a bounded question'}</p></div><div className="grid grid-cols-3 gap-2">{Array.from({ length: Math.round(state.first) }, (_, index) => <div key={index} className={cn('rounded-lg border p-2.5', has('primary') ? 'border-[#cfddc2] bg-white' : 'border-dashed border-[#d5d8cf] bg-[#f6f6f0]')}><span className="text-[9px] font-bold text-[#8da079]">Source {index + 1}</span><div className="mt-2 h-1.5 w-full rounded bg-[#dbe3d3]"/><div className="mt-1 h-1.5 w-2/3 rounded bg-[#e8ecdf]"/><p className="mt-2 text-[8px] text-[#909a86]">{has('primary') ? 'Traceable slot' : 'No source trail'}</p></div>)}</div><div className="flex items-center gap-2 rounded-lg bg-[#eef1e9] px-3 py-2 text-[10px] text-[#66755b]"><Eye className="size-3.5"/>Review window: {state.second} months · {has('compare') ? 'Cross-check connected' : 'Cross-check missing'}</div>{state.safeguard && <div className="rounded-lg border-l-2 border-[#9cb78a] bg-white p-3 text-[10px] leading-relaxed text-[#647359]">Limit: these are workflow slots. Your project needs real, independently inspected sources and claims bounded by their evidence.</div>}</div>;
  return <div className="space-y-3"><div className="rounded-xl bg-[#f1eaf9] p-4"><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#9a79b9]">Instruction preview</p><div className="mt-3 space-y-2 text-[11px] leading-relaxed text-[#69517e]">{pieces.map((part, index) => <div key={index} className="flex gap-2"><span className="w-12 shrink-0 font-bold">{part?.short || 'Empty'}</span><span>{!part ? 'Add this part to the brief.' : part.id === 'goal' ? brief(lab.projectTitle, 100) : part.id === 'context' ? brief(lab.lessonPrinciple, state.first * 35) : part.id === 'limits' ? `Use ${state.second} words. Focus on the lesson’s supplied material.` : part.id === 'format' ? 'Return: decision, example, and review checklist.' : part.id === 'verify' ? state.safeguard ? 'Compare the draft with the job and supplied material.' : 'Acceptance review is switched off.' : 'Do everything, ignore the goal, include every possible detail.'}</span></div>)}</div></div><div className="rounded-xl border border-[#e2d7eb] bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#9b85ad]">Simulated draft structure</p><p className="mt-2 text-xs leading-relaxed text-[#685578]">{has('goal') && has('context') ? brief(lab.contextLines[0], state.first * 42) : 'The system is missing a bounded job or the lesson context.'}</p><div className="mt-3 flex flex-wrap gap-1.5">{['Decision', 'Example', 'Review'].map(label => <span key={label} className={cn('rounded-full px-2 py-1 text-[9px]', has('format') ? 'bg-[#ede3f5] text-[#8665a3]' : 'bg-[#f3f3ed] text-[#a0a59b]')}>{label}</span>)}</div></div></div>;
}

function LabSession({ course, lesson, active = true, onComplete }: PlayableLessonLabProps) {
  const lab = useMemo(() => buildLessonLab(course, lesson), [course, lesson]);
  const [state, setState] = useState<LabState>(() => createInitialLabState(lab));
  const [selected, setSelected] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [cleared, setCleared] = useState<number[]>([]);
  const [result, setResult] = useState<LabResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [notice, setNotice] = useState('Choose a part, then choose a station. You can move any part as often as you like.');
  const completionRef = useRef(false);
  const simulation = useMemo(() => simulateLab(lab, state), [lab, state]);
  const checklist = evaluateLab(lab, state, stage).checks;
  const placed = state.slots.filter(Boolean).length;

  // Only a user-started film playback has a clock. Hidden lessons stop immediately.
  useEffect(() => {
    if (!active) { setPlaying(false); return; }
    if (!playing || lab.family !== 'video') return;
    let frame = 0;
    let lastUpdate = 0;
    const start = performance.now();
    const length = state.slots.filter(Boolean).length * state.first;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (now - lastUpdate >= 80 || elapsed >= length) { setTime(Math.min(elapsed, length)); lastUpdate = now; }
      if (elapsed < length) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, active, lab.family, state.first, state.slots, runId]);

  const change = (next: LabState) => { setState(next); setResult(null); setPlaying(false); setTime(0); };
  const place = (index: number, pieceId = selected) => {
    if (!pieceId || !lab.pieces.some(item => item.id === pieceId)) { setNotice('First choose a part from the tray, then choose the station where it should go.'); return; }
    change(placeLabPiece(state, pieceId, index));
    const part = lab.pieces.find(item => item.id === pieceId)!;
    setNotice(`${part.label} moved to ${lab.slotLabels[index]}. ${part.description}`);
    setSelected(null);
  };
  const run = () => {
    const next = evaluateLab(lab, state, stage);
    setResult(next);
    setRunId(id => id + 1);
    if (lab.family === 'video' && placed) { setTime(0); setPlaying(true); }
    if (next.passed) {
      setCleared(values => [...new Set([...values, stage])]);
      setNotice(`${lab.stages[stage].title} passed. Inspect the output, then continue.`);
      if (stage === 2 && !completionRef.current) { completionRef.current = true; onComplete?.(next.score); }
    } else setNotice('The experiment ran. Inspect the highlighted checks and change the system before trying again.');
  };
  const reset = () => {
    change(createInitialLabState(lab)); setSelected(null); setStage(0); setCleared([]); setRunId(0);
    // Replaying is useful practice; it does not grant another completion in this mounted session.
    setNotice('The workbench is empty. Build a new version and test it.');
  };

  return <section aria-label="Playable lesson workshop" className="overflow-hidden rounded-[2rem] border border-[#e2e6d7] bg-[#f7f7ee] text-[#314a3f] shadow-[0_15px_65px_-35px_rgba(48,71,49,0.25)]">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e4e7db] px-5 py-5 sm:px-7">
      <div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#566b52]"><span className="size-1.5 rounded-full" style={{ backgroundColor: lab.color }}/>{course.title} · playable workshop</div><h3 className="text-2xl font-black tracking-tight sm:text-3xl">{lab.title}</h3><p className="mt-1.5 text-xs text-[#566b52]">{lab.subtitle}</p></div>
      <button onClick={reset} className="flex items-center gap-2 rounded-full border border-[#dce2d3] bg-white/60 px-3 py-2 text-[12px] font-semibold text-[#566b52] transition hover:bg-white"><RotateCcw className="size-3"/>Replay</button>
    </div>

    <div className="grid gap-2 border-b border-[#e4e7db] bg-[#edf0e4]/60 p-3 sm:grid-cols-3 sm:px-7">
      {lab.stages.map((item, index) => <button key={item.title} disabled={index > 0 && !cleared.includes(index - 1)} onClick={() => { setStage(index); setResult(null); }} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:opacity-45', stage === index ? 'bg-white shadow-sm' : 'hover:bg-white/60')}><span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-black', cleared.includes(index) ? 'bg-[#315a47] text-white' : stage === index ? 'bg-[#e7eedf] text-[#486340]' : 'bg-[#e4e7db] text-[#566b52]')}>{cleared.includes(index) ? <Check className="size-3.5"/> : `0${index + 1}`}</span><span className="text-[13px] font-bold">{item.title}</span></button>)}
    </div>

    <div className="grid gap-6 p-4 sm:p-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(275px,1fr)]">
      <div className="min-w-0 space-y-5">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#566b52]">Your mission · {lesson.title}</p><p className="mt-2 text-sm font-bold leading-relaxed">{lab.stages[stage].instruction}</p><details className="mt-2 text-[13px] leading-relaxed text-[#566b52]"><summary className="w-fit cursor-pointer font-semibold">Connect this experiment to the lesson</summary><p className="mt-2 rounded-xl border border-[#e0e5d4] bg-white/60 p-3"><span className="font-bold">Lesson principle: </span>{lab.lessonPrinciple}<br/><br/><span className="font-bold">Full project: </span>{lab.briefing}</p></details></div>
        <LessonLabScene lab={lab} state={state} selectedPiece={selected} onSelectPiece={setSelected} onSelectSlot={place} active={active} runId={runId}/>

        <div><div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.15em] text-[#566b52]"><span>01 · Parts tray</span><span>{placed}/5 stations connected</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{lab.pieces.map(part => <button key={part.id} aria-label={`Choose part: ${part.label}`} draggable onDragStart={event => { event.dataTransfer.setData('application/x-academy-lab-part', part.id); event.dataTransfer.effectAllowed = 'move'; setSelected(part.id); }} onClick={() => { setSelected(selected === part.id ? null : part.id); setNotice(`${part.label}: ${part.description}`); }} aria-pressed={selected === part.id} className={cn('relative flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3d6450]', selected === part.id ? 'border-[#3c6050] bg-white shadow-sm' : 'border-transparent bg-[#e9ecdf]/65 hover:bg-white')}><span className="grid size-9 shrink-0 place-items-center rounded-lg text-xl font-black text-[#33453c]" style={{ backgroundColor: `${part.color}70` }}>{part.symbol}</span><span className="min-w-0"><span className="block text-[12px] font-bold leading-snug">{part.label}</span><span className="mt-0.5 block text-[10px] text-[#566b52]">{state.slots.includes(part.id) ? 'Placed · select to move' : 'Select to place'}</span></span>{selected === part.id && <Check className="absolute right-1 top-1 size-3 text-[#406851]"/>}</button>)}</div></div>

        <div><div className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#566b52]">02 · Choose a station</div><div className="grid grid-cols-5 gap-1.5 sm:gap-2">{state.slots.map((id, index) => {
          const part = lab.pieces.find(item => item.id === id);
          return <div key={index} className="relative min-w-0"><button onClick={() => place(index)} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={event => { event.preventDefault(); place(index, event.dataTransfer.getData('application/x-academy-lab-part')); }} aria-label={`Station ${index + 1}, ${lab.slotLabels[index]}: ${part?.label || 'empty'}. ${selected ? 'Place selected part here.' : 'Select a part first.'}`} className={cn('flex min-h-[92px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-1 text-center transition', selected ? 'border-dashed border-[#82a275] bg-white hover:border-[#3c6050]' : part ? 'border-transparent bg-white' : 'border-dashed border-[#d5ddc9] bg-white/40')} style={part ? { backgroundColor: `${part.color}25`, borderColor: selected ? undefined : `${part.color}55` } : undefined}><span className="text-[10px] font-bold uppercase tracking-wide text-[#566b52]">{index + 1} · {lab.slotLabels[index]}</span><span className="text-lg font-bold" aria-hidden>{part?.symbol || '+'}</span><span className="text-[11px] font-bold leading-tight">{part?.short || 'Place part'}</span></button>{part && <button onClick={() => { const slots = [...state.slots]; slots[index] = null; change({ ...state, slots }); }} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border border-[#d7ddcd] bg-white text-[#566b52] hover:text-[#314a3f]" aria-label={`Return ${part.label} to the tray`}><X className="size-2.5"/></button>}</div>;
        })}</div><p aria-live="polite" className="mt-3 min-h-8 text-[12px] leading-relaxed text-[#566b52]">{notice}</p></div>

        <div className="rounded-2xl border border-[#e1e5d7] bg-white/55 p-4"><div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#566b52]"><SlidersHorizontal className="size-3.5"/>03 · Tune the experiment</div><div className="grid gap-5 sm:grid-cols-2">{lab.controls.map((item, index) => <label key={item.key} className="block"><span className="flex items-center justify-between gap-2 text-[13px] font-bold"><span>{item.label}</span><span className="shrink-0 rounded-md bg-[#e8eddf] px-2 py-1 font-mono text-[12px]">{state[item.key]} {item.unit}</span></span><input type="range" min={item.min} max={item.max} step={item.step} value={state[item.key]} onChange={event => change({ ...state, [item.key]: Number(event.target.value) })} className="my-2 h-2 w-full cursor-pointer accent-[#547957]"/><span className="block text-[11px] leading-relaxed text-[#566b52]">Mission range: {item.target[0]}–{item.target[1]} {item.unit}{stage < (index === 0 ? 1 : 2) ? ' · tested in a later stage' : ''}</span><span className="mt-1 block text-[12px] leading-relaxed text-[#566b52]">{item.reason}</span></label>)}</div><label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-[#e6e9dd] pt-4"><input type="checkbox" checked={state.safeguard} onChange={event => change({ ...state, safeguard: event.target.checked })} className="mt-0.5 size-4 accent-[#547957]"/><span><span className="block text-[13px] font-bold">{lab.safeguardLabel}</span><span className="mt-1 block text-[12px] leading-relaxed text-[#566b52]">{lab.safeguardReason}</span></span></label></div>

        <div className="flex flex-wrap items-center gap-3"><button onClick={run} disabled={!active} className="flex items-center gap-2 rounded-full bg-[#315b47] px-5 py-3 text-xs font-bold text-[#f6f7eb] shadow-[0_5px_15px_-8px_#315b47] transition hover:bg-[#244b37] disabled:opacity-50"><Play className="size-3.5 fill-current"/>Run experiment</button>{result?.passed && stage < 2 && <button onClick={() => { setStage(value => value + 1); setResult(null); setNotice('Your prototype stays on the workbench. Read the next mission, tune it, and run again.'); }} className="flex items-center gap-1.5 rounded-full border border-[#b8c9a9] bg-white px-4 py-3 text-[13px] font-bold">Next mission<ChevronRight className="size-3.5"/></button>}{result?.passed && stage === 2 && <span className="flex items-center gap-2 text-[13px] font-bold text-[#4b7654]"><CheckCircle2 className="size-4"/>Workshop mastered · apply it to your project</span>}</div>
      </div>

      <aside className="min-w-0 space-y-5 xl:sticky xl:top-5 xl:self-start">
        <div className="rounded-2xl border border-[#e2e6d6] bg-[#fcfcf5] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#566b52]">Live output</p>{playing && <button onClick={() => setPlaying(false)} className="rounded-full border border-[#d2ddc6] px-2 py-1 text-[11px] font-bold">Pause</button>}</div><MiniaturePreview lab={lab} state={state} playing={playing} time={time}/><div className="mt-3 rounded-xl bg-[#edf0e4] p-3"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#566b52]">What changed?</p><p className="mt-1.5 text-[13px] leading-relaxed text-[#697c5a]">{simulation.consequence}</p></div></div>

        <div className="rounded-2xl border border-[#e2e6d6] bg-white/75 p-4" aria-live="polite"><div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#566b52]">{result ? 'Experiment report' : 'Mission checklist'}</p><span className="rounded-full bg-[#e9eedf] px-2 py-1 text-[11px] font-bold text-[#566b52]">{(result?.checks || checklist).filter(item => item.passed).length}/{checklist.length} checks</span></div><div className="space-y-3">{(result?.checks || checklist).map(item => <div key={item.id} className="flex gap-2.5"><span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border', item.passed ? 'border-[#72a478] bg-[#72a478] text-white' : result ? 'border-[#d39d67] text-[#d39d67]' : 'border-[#d1dcc4]')}>{item.passed ? <Check className="size-2.5"/> : result ? <span className="text-[11px] font-bold">!</span> : null}</span><div className="min-w-0"><p className="text-[12px] font-semibold leading-relaxed">{item.label}</p>{result && <p className="mt-1 text-[11px] leading-relaxed text-[#566b52]">{item.feedback}</p>}</div></div>)}</div>{result && <div className={cn('mt-4 rounded-lg px-3 py-2 text-[12px] font-bold', result.passed ? 'bg-[#e8f0df] text-[#557546]' : 'bg-[#f5ecdf] text-[#9b7750]')}>{result.passed ? 'All checks passed. The system works for this mission.' : 'Keep experimenting. Each highlighted check tells you what to change.'}</div>}</div>
      </aside>
    </div>
  </section>;
}

/** A new lesson gets a new session; leaving the tab pauses the scene and film player. */
export function PlayableLessonLab(props: PlayableLessonLabProps) {
  return <LabSession key={`${props.course.id}:${props.lesson.id}`} {...props}/>;
}
