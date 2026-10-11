'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, Lightbulb, Minus, Play, Plus, RotateCcw, Scissors, X } from 'lucide-react';
import type { Course, Lesson } from '@/lib/data-provider';
import { applyPlayAction, buildLearningPlayGame, createPlayRoundState, evaluatePlayRound, type PlayAction, type PlayRound, type PlayRoundResult, type PlayRoundState, type Point } from '@/lib/learning-play-games';
import { cn } from '@/lib/utils';

const LearningPlayScene = dynamic(() => import('./LearningPlayScene').then(module => module.LearningPlayScene), { ssr: false });
export type LearningPlayGameProps = { course: Course; lesson: Lesson; active?: boolean; onComplete?: (score: number) => void };
type BoardProps = { round: PlayRound; state: PlayRoundState; change: (action: PlayAction) => void; selected: string | null; select: (id: string | null) => void; result: PlayRoundResult; submitted: boolean; running: boolean; time: number };
const trim = (value: string, length = 110) => value.length > length ? `${value.slice(0, length - 1)}…` : value;
const iconButton = 'grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#335cff] hover:text-[#335cff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#335cff]';

function CircuitBoard({ round, state, change, result, submitted }: BoardProps) {
  const circuit = round.circuit!;
  return <div className="mx-auto flex h-full max-w-[440px] flex-col justify-center gap-3 px-2 py-2">
    <div className="flex items-center justify-between gap-3 font-mono text-xs text-slate-500"><span className="rounded-lg bg-slate-100 px-2.5 py-2">IN [{circuit.samples.map(value => value === '' ? 'empty' : value).join(', ')}]</span><ArrowRight className="size-4 shrink-0 text-[#335cff]"/><span className="max-w-[45%] truncate rounded-lg bg-[#335cff]/8 px-2.5 py-2 text-[#335cff]">{result.passed ? 'OUT' : 'PACKET'} [{result.values?.map(value => value === '' ? 'empty' : value).join(', ') || '?'}]</span></div>
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
      {circuit.tiles.map((tile, index) => {
        const connected = result.trace?.includes(index);
        const blocked = submitted && result.blockedAt === index;
        const rotation = state.rotations[index];
        return <button key={index} aria-label={`Rotate circuit tile ${index + 1}${tile.node ? `, ${tile.node}` : ''}`} onClick={() => change({ type: 'rotate', index })} className={cn('relative aspect-square rounded-xl border bg-white transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#335cff]', blocked ? 'border-orange-400 bg-orange-50' : connected ? 'border-[#335cff]/60 bg-[#335cff]/4' : 'border-slate-200')}>
          <svg viewBox="0 0 80 80" className="absolute inset-0 size-full" aria-hidden="true"><g transform={`rotate(${rotation * 90} 40 40)`}><path d={tile.shape === 'straight' ? 'M0 40H80' : 'M40 0V28Q40 40 52 40H80'} fill="none" stroke={connected ? '#335cff' : '#a8b3c4'} strokeWidth="13"/><path d={tile.shape === 'straight' ? 'M0 40H80' : 'M40 0V28Q40 40 52 40H80'} fill="none" stroke="white" strokeWidth="5"/></g>{tile.node && <g><rect x="15" y="28" width="50" height="24" rx="6" fill={tile.node === 'work' ? '#335cff' : '#263244'}/><text x="40" y="43.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{tile.node === 'work' ? circuit.operation === 'double' ? '× 2' : circuit.operation === 'sort' ? 'SORT' : circuit.operation === 'uppercase' ? 'ABC' : 'UI' : tile.node.toUpperCase()}</text></g>}{connected && !blocked && <circle cx="7" cy="7" r="3" fill="#335cff"/>}</svg>
          {index === 4 && <span className="absolute -left-1 top-1/2 -translate-y-1/2 rounded bg-[#335cff] px-1 text-[9px] font-semibold text-white">IN</span>}{index === 7 && <span className="absolute -right-1 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-1 text-[9px] font-semibold text-white">OUT</span>}
        </button>;
      })}
    </div>
    <p className="text-center text-[11px] text-slate-500">Tap a piece to turn it 90°. Focus it and press Enter to rotate.</p>
  </div>;
}

function OrderedBoard({ round, state, change, selected, select, running, time }: BoardProps) {
  const video = round.family === 'video';
  const expectedCount = round.expected.length;
  const duration = state.order.reduce((value, id) => value + (state.durations[id] || 2), 0);
  let elapsed = 0;
  const currentClip = state.order.find(id => { elapsed += state.durations[id] || 2; return elapsed > time; }) || state.order.at(-1);
  const selectedCard = round.cards.find(item => item.id === (running ? currentClip : selected || currentClip));
  const place = (id: string, index: number) => { if (round.cards.some(item => item.id === id)) change({ type: 'place', id, index }); };
  return <div className="flex h-full flex-col justify-center gap-3 px-1 py-3 sm:px-3">
    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>{video ? 'Your cut' : 'Your instruction'}</span><span>{video ? `${duration}s / ${round.clipBudget}s` : `${state.order.length}/${expectedCount} parts`}</span></div>
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(expectedCount, state.order.length)}, minmax(0, 1fr))` }}>
      {Array.from({ length: Math.max(expectedCount, state.order.length) }, (_, index) => {
        const id = state.order[index]; const item = round.cards.find(card => card.id === id);
        return <div key={index} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); place(event.dataTransfer.getData('application/x-academy-piece'), index); }} className={cn('relative flex min-h-[75px] min-w-0 flex-col justify-center rounded-lg border px-1.5 py-2 text-center', item ? selected === id ? 'border-[#335cff] bg-[#335cff]/6' : 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50')}>
          <button disabled={!item && !selected} onClick={() => item ? select(selected === id ? null : id) : selected && place(selected, index)} className="flex w-full flex-col items-center gap-1.5 text-center"><span className="text-[9px] font-semibold text-slate-400">{index + 1}</span><span className="text-[11px] font-semibold leading-snug text-slate-800">{item?.title || '+'}</span>{video && item && <span className="font-mono text-[10px] text-[#335cff]">{state.durations[id]}s</span>}</button>
          {running && id === currentClip && <div className="absolute inset-x-1 bottom-0.5 h-0.5 rounded bg-[#335cff]"/>}
          {item && selected === id && <button aria-label={`Remove ${item.title}`} onClick={() => { change({ type: 'remove', id }); select(null); }} className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-slate-800 text-white"><X className="size-2.5"/></button>}
        </div>;
      })}
    </div>
    <div className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <p className="min-w-0 text-[11px] leading-relaxed text-slate-600">{selectedCard ? trim(selectedCard.text, 115) : video ? 'Tap a clip to inspect it. Move it along the timeline.' : 'Tap a block to add it. Drag, or use the arrows to repair the reading order.'}</p>
      {selected && state.order.includes(selected) && <div className="flex shrink-0 gap-1"><button className={iconButton} aria-label="Move selected block earlier" onClick={() => place(selected, Math.max(0, state.order.indexOf(selected) - 1))}><ArrowLeft className="size-3.5"/></button><button className={iconButton} aria-label="Move selected block later" onClick={() => place(selected, Math.min(state.order.length - 1, state.order.indexOf(selected) + 1))}><ArrowRight className="size-3.5"/></button></div>}
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {round.cards.map(item => <button key={item.id} draggable onDragStart={event => { event.dataTransfer.setData('application/x-academy-piece', item.id); select(item.id); }} onClick={() => { select(item.id); if (!state.order.includes(item.id)) place(item.id, state.order.length); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); select(item.id); place(item.id, Math.max(0, state.order.indexOf(item.id) + (event.key === 'ArrowLeft' ? -1 : 1))); } if (event.key === 'Delete') change({ type: 'remove', id: item.id }); }} aria-label={`${video ? 'Clip' : 'Instruction'}: ${item.title}`} className={cn('flex min-h-12 min-w-0 flex-col rounded-lg border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#335cff]', selected === item.id ? 'border-[#335cff] bg-[#335cff]/5' : state.order.includes(item.id) ? 'border-slate-200 bg-slate-100/60 text-slate-500' : 'border-slate-200 bg-white hover:border-[#335cff]')}><span className="text-xs font-semibold">{item.title}</span><span className="mt-0.5 line-clamp-1 text-[10px] leading-relaxed text-slate-500">{item.text}</span></button>)}
    </div>
    {video && <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Scissors className="size-3.5 text-slate-500"/><span className="text-[11px] text-slate-600">{selected && state.order.includes(selected) ? round.cards.find(item => item.id === selected)?.title : 'Select a clip to cut'}</span><button disabled={!selected || !state.order.includes(selected)} className={cn(iconButton, 'disabled:opacity-35')} aria-label="Trim selected clip by one second" onClick={() => selected && change({ type: 'cut', id: selected, delta: -1 })}><Minus className="size-3"/></button><button disabled={!selected || !state.order.includes(selected)} className={cn(iconButton, 'disabled:opacity-35')} aria-label="Extend selected clip by one second" onClick={() => selected && change({ type: 'cut', id: selected, delta: 1 })}><Plus className="size-3"/></button></div><button aria-pressed={state.captions} onClick={() => change({ type: 'captions' })} className={cn('rounded-lg border px-2.5 py-2 text-[11px] font-semibold', state.captions ? 'border-[#335cff] bg-[#335cff]/5 text-[#335cff]' : 'border-slate-200 text-slate-500')}>CC {state.captions ? 'on' : 'off'}</button></div>}
  </div>;
}

function EvidenceBoard({ round, state, change, selected, select }: BoardProps) {
  const sources = round.cards;
  const claims = round.claims || [];
  return <div className="relative grid h-full grid-cols-2 gap-8 px-1 py-3 sm:gap-14 sm:px-4">
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{Object.entries(state.links).filter(([, source]) => source).map(([claim, source]) => { const sourceIndex = sources.findIndex(item => item.id === source), claimIndex = claims.findIndex(item => item.id === claim); const correct = round.evidenceLinks?.[claim] === source; return <path key={claim} d={`M44 ${(sourceIndex + 0.5) / sources.length * 91 + 4} C55 ${(sourceIndex + 0.5) / sources.length * 91 + 4},45 ${(claimIndex + 0.5) / claims.length * 91 + 4},56 ${(claimIndex + 0.5) / claims.length * 91 + 4}`} fill="none" stroke={correct ? '#335cff' : '#ef8a43'} strokeWidth="0.7"/>; })}</svg>
    <div className="z-10 flex flex-col justify-center gap-2"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Original material</p>{sources.map(item => <button key={item.id} draggable onDragStart={event => { event.dataTransfer.setData('application/x-academy-source', item.id); select(item.id); }} onClick={() => select(selected === item.id ? null : item.id)} aria-pressed={selected === item.id} aria-label={`Evidence: ${item.title}`} className={cn('relative flex min-h-20 flex-1 flex-col justify-center rounded-xl border px-3 py-2 text-left transition', selected === item.id ? 'border-[#335cff] bg-[#335cff]/5' : 'border-slate-200 bg-white hover:border-[#335cff]')}><span className="text-[11px] font-semibold text-slate-800">{item.title}</span><span className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-slate-500">{trim(item.text, 135)}</span><span className="absolute -right-1 top-1/2 size-2 rounded-full bg-[#335cff]"/></button>)}</div>
    <div className="z-10 flex flex-col justify-center gap-2"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Claims in the brief</p>{claims.map(item => { const connected = state.links[item.id]; const supported = connected && round.evidenceLinks?.[item.id] === connected; return <button key={item.id} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const source = event.dataTransfer.getData('application/x-academy-source'); if (sources.some(item => item.id === source)) change({ type: 'connect', source, claim: item.id }); }} onClick={() => selected ? change({ type: 'connect', source: selected, claim: item.id }) : connected ? change({ type: 'connect', source: connected, claim: item.id }) : select(null)} aria-label={`Claim: ${item.title}${connected ? ', connected' : ''}`} className={cn('relative flex min-h-20 flex-1 flex-col justify-center rounded-xl border px-3 py-2 text-left', supported ? 'border-[#335cff]/50 bg-[#335cff]/5' : connected ? 'border-orange-300 bg-orange-50' : 'border-dashed border-slate-300 bg-slate-50')}><span className="text-[11px] font-semibold text-slate-800">{item.title}</span><span className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-slate-500">{item.text}</span><span className={cn('absolute -left-1 top-1/2 size-2 rounded-full', connected ? supported ? 'bg-[#335cff]' : 'bg-orange-400' : 'bg-slate-300')}/></button>; })}</div>
  </div>;
}

function PositionBoard({ round, state, change, selected, select }: BoardProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const creative = round.family === 'creative';
  const target = creative ? { subject: round.focalTarget! } : round.targets!;
  const moveAt = (id: string, clientX: number, clientY: number) => {
    const bounds = hostRef.current?.getBoundingClientRect(); if (!bounds?.width || !bounds.height) return;
    const point = { x: (clientX - bounds.left) / bounds.width * 100, y: (clientY - bounds.top) / bounds.height * 100 };
    const goal = target[id]; if (goal && Math.hypot(point.x - goal.x, point.y - goal.y) < 8) { point.x = goal.x; point.y = goal.y; }
    change({ type: 'move', id, point });
  };
  const moveKey = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(id); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
    event.preventDefault(); select(id);
    if (creative && ['+', '=', '-'].includes(event.key)) { change({ type: 'resize', delta: event.key === '-' ? -2 : 2 }); return; }
    const position = state.positions[id]; const step = event.shiftKey ? 1 : 5;
    change({ type: 'move', id, point: { x: position.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y: position.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) } });
  };
  const pointerHandlers = (id: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => { event.preventDefault(); select(id); dragging.current = id; event.currentTarget.setPointerCapture(event.pointerId); },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => { if (dragging.current === id) moveAt(id, event.clientX, event.clientY); },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => { if (dragging.current === id) { moveAt(id, event.clientX, event.clientY); dragging.current = null; } if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); },
    onPointerCancel: () => { dragging.current = null; }, onKeyDown: (event: React.KeyboardEvent) => moveKey(event, id),
  });
  return <div className="flex h-full flex-col gap-2 py-2">
    <div ref={hostRef} data-play-surface={creative ? 'composition' : 'layout'} className={cn('relative min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200', creative ? 'bg-[#182332]' : 'bg-slate-50')}>
      {!creative && <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#ccd3df 1px, transparent 1px)', backgroundSize: '16px 16px' }}/>}
      {creative ? <><div className={cn('absolute rounded-lg border border-white/20 bg-gradient-to-br from-[#203551] to-[#131a24]', round.id.endsWith('-1') ? 'inset-x-[16%] inset-y-[8%]' : 'inset-3')}/><div className={cn('pointer-events-none absolute max-w-[40%] text-white', round.id.endsWith('-1') ? 'left-[22%] top-[24%]' : 'left-[9%] top-[22%]')}><p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#94b0ff]">One message</p><h4 className="text-base font-black leading-tight sm:text-xl">{trim(round.cards[0].text, 56)}</h4><div className="mt-4 h-1 w-10 rounded bg-[#335cff]"/></div>{state.safeArea && <div className="pointer-events-none absolute inset-[9%] rounded-lg border border-dashed border-[#90aaff]"/>}</> : round.id.endsWith('-1') ? <div className="absolute bottom-[15%] left-[7%] top-[17%] w-[32%] rounded-lg bg-gradient-to-br from-[#d7e0fa] to-[#b3c5ed]"><div className="absolute left-1/4 top-1/3 size-10 rounded-full bg-white/70 sm:size-16"/></div> : <div className="absolute left-4 top-3 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-400">{round.id.endsWith('-2') ? 'Centered decision screen' : 'Reading path'}</div>}
      {Object.entries(target).map(([id, point]) => <div key={id} className={cn('pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 border border-dashed', creative ? 'aspect-square rounded-[32%] border-[#9cb4ff]/75' : id === 'action' ? 'h-10 w-[36%] max-w-[130px] rounded-lg border-[#335cff]/40' : 'h-14 w-[54%] max-w-[230px] rounded-lg border-[#335cff]/40')} style={{ left: `${point.x}%`, top: `${point.y}%`, ...(creative ? { width: `${round.focalSize}%` } : {}) }}><span className={cn('absolute -top-4 left-0 text-[8px] font-semibold uppercase tracking-wider', creative ? 'text-[#97aff3]' : 'text-[#7992d7]')}>{creative ? 'Focal guide' : id}</span></div>)}
      {round.cards.map(item => {
        const position = state.positions[item.id]; if (!position) return null;
        const matched = Math.hypot(position.x - target[item.id].x, position.y - target[item.id].y) <= 6;
        return <div key={item.id} role="button" tabIndex={0} aria-label={`Move ${item.title}. Arrow keys move; Shift plus arrows fine tune.${creative ? ' Plus and minus resize.' : ''}`} {...pointerHandlers(item.id)} onClick={() => select(item.id)} className={cn('absolute -translate-x-1/2 -translate-y-1/2 touch-none select-none outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-[#335cff] focus-visible:ring-offset-2', creative ? 'aspect-square cursor-grab rounded-[32%] bg-gradient-to-br from-[#83a5ff] via-[#335cff] to-[#183ea7] shadow-[12px_16px_24px_-8px_rgba(0,0,0,.55)] active:cursor-grabbing' : item.id === 'action' ? 'flex h-10 w-[36%] max-w-[130px] cursor-grab items-center justify-center rounded-lg bg-[#335cff] px-2 text-center text-[11px] font-semibold text-white active:cursor-grabbing' : 'flex min-h-12 w-[54%] max-w-[230px] cursor-grab flex-col justify-center rounded-lg border bg-white px-3 py-2 active:cursor-grabbing', !creative && item.id !== 'action' && (matched ? 'border-[#335cff]/60' : 'border-slate-300'), selected === item.id && 'ring-2 ring-[#335cff] ring-offset-2')} style={{ left: `${position.x}%`, top: `${position.y}%`, ...(creative ? { width: `${state.size}%` } : {}) }}>
          {creative ? <><div className="absolute left-[16%] top-[13%] h-[18%] w-[42%] rotate-[-25deg] rounded-full bg-white/55 blur-[2px]"/><svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true"><path d="M50 18L58 40L82 50L58 58L50 82L42 58L18 50L42 42Z" fill="none" stroke="white" strokeWidth="2" opacity=".7"/></svg></> : <><span className={cn(item.id === 'heading' ? 'text-[13px] font-semibold leading-tight sm:text-base' : item.id === 'body' ? 'text-[10px] leading-relaxed text-slate-600' : 'text-[11px] font-semibold')}>{item.text}</span></>}
        </div>;
      })}
    </div>
    <div className="flex min-h-9 items-center justify-between gap-2"><span className="min-w-0 text-[10px] text-slate-500">Drag directly. Select an object for precise controls.</span><div className="flex shrink-0 gap-1">{[['left', ArrowLeft, -5, 0], ['up', ArrowUp, 0, -5], ['down', ArrowDown, 0, 5], ['right', ArrowRight, 5, 0]].map(([label, Icon, dx, dy]) => { const ArrowIcon = Icon as typeof ArrowLeft; return <button key={String(label)} className={cn(iconButton, 'size-7 disabled:opacity-30')} disabled={!selected} aria-label={`Move selected object ${label}`} onClick={() => selected && state.positions[selected] && change({ type: 'move', id: selected, point: { x: state.positions[selected].x + Number(dx), y: state.positions[selected].y + Number(dy) } })}><ArrowIcon className="size-3"/></button>; })}</div></div>
    {creative && <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><button className={iconButton} aria-label="Shrink focal object" onClick={() => change({ type: 'resize', delta: -2 })}><Minus className="size-3"/></button><span className="text-[11px] font-semibold text-slate-600">{state.size}%</span><button className={iconButton} aria-label="Enlarge focal object" onClick={() => change({ type: 'resize', delta: 2 })}><Plus className="size-3"/></button></div><button aria-pressed={state.safeArea} onClick={() => change({ type: 'safe-area' })} className={cn('rounded-lg border px-3 py-2 text-[11px] font-semibold', state.safeArea ? 'border-[#335cff] text-[#335cff]' : 'border-slate-200 text-slate-600')}>Safe area {state.safeArea ? 'on' : 'off'}</button></div>}
  </div>;
}

function PlaySession({ course, lesson, active = true, onComplete }: LearningPlayGameProps) {
  const plan = useMemo(() => buildLearningPlayGame(course, lesson), [course, lesson]);
  const [roundIndex, setRoundIndex] = useState(0);
  const round = plan.rounds[roundIndex];
  const [state, setState] = useState(() => createPlayRoundState(round));
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [outcome, setOutcome] = useState<'playing' | 'success' | 'retry'>('playing');
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [cleared, setCleared] = useState<number[]>([]);
  const [visible, setVisible] = useState(true);
  const reported = useRef(false);
  const result = useMemo(() => evaluatePlayRound(round, state), [round, state]);

  useEffect(() => {
    const update = () => { setVisible(!document.hidden); if (document.hidden) setRunning(false); };
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!active || !visible || !running || plan.family !== 'video') { if (!active || !visible) setRunning(false); return; }
    const start = performance.now();
    const length = state.order.reduce((sum, id) => sum + state.durations[id], 0);
    const timer = window.setInterval(() => { const elapsed = (performance.now() - start) / 1000; setTime(Math.min(elapsed, length)); if (elapsed >= length) setRunning(false); }, 100);
    return () => clearInterval(timer);
  }, [active, visible, running, plan.family, state.order, state.durations]);

  const change = (action: PlayAction) => {
    if (!active || document.hidden || outcome === 'success') return;
    setState(value => applyPlayAction(value, action)); setSubmitted(false); setOutcome('playing'); setRunning(false); setTime(0);
  };
  const submit = () => {
    if (!active || document.hidden || outcome === 'success') return;
    setSubmitted(true); setAttempts(value => value + 1);
    if (plan.family === 'video') { setTime(0); setRunning(true); }
    if (result.passed) {
      setOutcome('success'); setCleared(values => [...new Set([...values, roundIndex])]);
      const nextCombo = attempts === 0 ? combo + 1 : 1; setCombo(nextCombo); setPoints(value => value + Math.max(60, 100 - attempts * 10) + (nextCombo - 1) * 15);
      if (roundIndex === 2 && !reported.current) { reported.current = true; onComplete?.(100); }
    } else { setOutcome('retry'); setCombo(0); }
  };
  const next = () => {
    if (!active || outcome !== 'success' || roundIndex >= 2) return;
    const index = roundIndex + 1; setRoundIndex(index); setState(createPlayRoundState(plan.rounds[index])); setSelected(null); setSubmitted(false); setOutcome('playing'); setAttempts(0); setHint(false); setRunning(false); setTime(0);
  };
  const replay = () => { if (!active) return; setRoundIndex(0); setState(createPlayRoundState(plan.rounds[0])); setSelected(null); setSubmitted(false); setOutcome('playing'); setAttempts(0); setPoints(0); setCombo(0); setCleared([]); setRunning(false); setTime(0); };
  const boardProps: BoardProps = { round, state, change, selected, select: setSelected, result, submitted, running, time };
  const poses = plan.family === 'code' ? (round.circuit?.path.slice(0, 3) || []).map(index => ({ id: String(index), x: (index % 4 + 0.5) / 4, y: (Math.floor(index / 4) + 0.5) / 3, rotation: state.rotations[index] * Math.PI / 2 })) : plan.family === 'design' || plan.family === 'creative' ? Object.entries(state.positions).slice(0, 3).map(([id, point]) => ({ id, x: point.x / 100, y: point.y / 100, ...(plan.family === 'creative' ? { scale: state.size / 100 } : {}) })) : plan.family === 'research' ? round.cards.slice(0, 3).map((item, index) => { const link = Object.entries(state.links).find(([, source]) => source === item.id); const claim = round.claims?.findIndex(item => item.id === link?.[0]) ?? -1; return { id: item.id, x: link ? 0.75 : 0.25, y: link && claim >= 0 ? (claim + 0.5) / (round.claims?.length || 1) : (index + 0.5) / round.cards.length, placed: !!link }; }) : state.order.slice(0, 3).map((id, index) => ({ id, x: (index + 1) / 4, y: 0.55, placed: true }));
  const sceneProgress = plan.family === 'video' && running ? time / Math.max(1, state.order.reduce((total, id) => total + state.durations[id], 0)) : result.progress;

  return <section aria-label="Playable learning game" className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Play & learn</p><h3 className="mt-1 text-xl font-semibold tracking-tight">{plan.title}</h3></div><div className="flex items-center gap-3"><span className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm font-semibold tabular-nums">{points}<span className="ml-1.5 text-[9px] font-medium text-slate-400">PTS</span></span>{combo > 1 && <span className="text-[11px] font-semibold text-[#335cff]">×{combo} combo</span>}<button className={iconButton} aria-label="Replay the learning game" onClick={replay}><RotateCcw className="size-3.5"/></button></div></div>
    <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6"><div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded bg-[#335cff]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#335cff]">{roundIndex + 1}/3</span><h4 className="text-sm font-semibold">{round.title}</h4></div><p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-600">{round.goal}</p></div><div className="flex shrink-0 items-center gap-1.5 pt-1">{plan.rounds.map((_, index) => <span key={index} aria-label={`Round ${index + 1}${cleared.includes(index) ? ' complete' : ''}`} className={cn('size-2 rounded-full', cleared.includes(index) ? 'bg-[#f28b45]' : index === roundIndex ? 'bg-[#335cff]' : 'bg-slate-200')}/>)}</div></div>
    <div className="relative mx-3 mt-3 grid min-h-[310px] gap-4 rounded-xl bg-[#fafbfe] px-2 sm:mx-5 sm:min-h-[330px] sm:px-4 lg:grid-cols-[minmax(0,1fr)_200px]">
      <div className="relative min-h-[300px] min-w-0 py-1 sm:min-h-[320px]">
        <fieldset disabled={!active || !visible} className="h-full min-w-0">
        {plan.family === 'code' ? <CircuitBoard {...boardProps}/> : plan.family === 'prompt' || plan.family === 'video' ? <OrderedBoard {...boardProps}/> : plan.family === 'research' ? <EvidenceBoard {...boardProps}/> : <PositionBoard {...boardProps}/>}
        </fieldset>
      </div>
      <div className="pointer-events-none relative -mt-3 flex items-center justify-center gap-3 self-center pb-2 lg:mt-0 lg:block lg:pb-0"><LearningPlayScene family={plan.family} round={roundIndex} progress={sceneProgress} outcome={outcome} active={active && visible} poses={poses} selectedId={selected} className="h-[120px] w-[160px] shrink-0 lg:h-[230px] lg:w-full"/><p className="max-w-[130px] text-[10px] leading-relaxed text-slate-500 lg:mt-1 lg:max-w-none lg:text-center">{outcome === 'success' ? 'The result is ready.' : 'Your moves change the model.'}</p></div>
      {hint && <div className="absolute inset-x-3 bottom-3 z-30 max-h-44 overflow-auto rounded-xl border border-[#335cff]/20 bg-white/95 p-4 shadow-lg"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#335cff]">From your lesson</p><button className="text-slate-400" aria-label="Close lesson hint" onClick={() => setHint(false)}><X className="size-4"/></button></div><p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-600">{round.hint}</p></div>}
    </div>
    {plan.family === 'prompt' && submitted && result.passed && <div className="mx-4 mt-3 border-t border-slate-100 pt-3 sm:mx-6"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#335cff]">Draft instruction</p><p className="mt-1.5 max-h-28 overflow-auto whitespace-pre-line text-xs leading-relaxed text-slate-600">{result.output}</p></div>}
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="flex min-w-0 flex-1 items-start gap-2"><button onClick={() => setHint(value => !value)} aria-expanded={hint} className={cn(iconButton, 'size-8')} aria-label="Show a hint from this lesson"><Lightbulb className="size-3.5"/></button><p aria-live="polite" className={cn('max-w-xl pt-1 text-[11px] leading-relaxed', outcome === 'success' ? 'font-semibold text-slate-800' : outcome === 'retry' ? 'text-[#a45622]' : 'text-slate-500')}>{submitted ? result.feedback : plan.family === 'research' ? 'Choose an original source, then connect it to a claim. Click a link again to remove it.' : plan.family === 'design' || plan.family === 'creative' ? 'Move the actual object. Snap to the guide, then inspect your result.' : 'Experiment with the pieces. The result reacts to every move.'}</p></div>{outcome === 'success' ? roundIndex < 2 ? <button onClick={next} className="flex shrink-0 items-center gap-2 rounded-lg bg-[#335cff] px-4 py-2.5 text-xs font-semibold text-white">Next round<ChevronRight className="size-3.5"/></button> : <span className="flex shrink-0 items-center gap-2 rounded-lg bg-orange-50 px-3 py-2.5 text-xs font-semibold text-slate-800"><Check className="size-3.5 text-[#ed8746]"/>Three rounds mastered</span> : <button onClick={submit} disabled={!active} className="flex shrink-0 items-center gap-2 rounded-lg bg-[#335cff] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#244bf0] disabled:opacity-50"><Play className="size-3 fill-current"/>{round.action}</button>}</div>
  </section>;
}

export function LearningPlayGame(props: LearningPlayGameProps) { return <PlaySession key={`${props.course.id}:${props.lesson.id}`} {...props}/>; }
