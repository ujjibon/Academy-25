'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, Compass, Download, Flag, Gamepad2, Hammer, Layers3, Loader2, Play, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';
import type { Course, Lesson } from '@/lib/data-provider';
import { createLessonTrainingPack, TrainingPackSchema, type TrainingPack } from '@/lib/learning-experience';
import { useQuestProgress } from '@/hooks/use-quest-progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GuidedLessonFlow } from '@/components/courses/GuidedLessonFlow';
import { AILearningClassroom } from '@/components/courses/AILearningClassroom';
import { CourseGamifyPanel } from '@/components/courses/CourseGamifyPanel';
import { InteractiveQuizPlayer } from '@/components/courses/InteractiveQuizPlayer';
import { buildCurriculumGame } from '@/lib/curriculum-games';

const LearningWorld3D = dynamic(() => import('@/components/learning/LearningWorld3D').then(m => m.LearningWorld3D), {
  ssr: false,
  loading: () => <div className="flex h-72 items-center justify-center rounded-3xl bg-teal-50"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Preparing your island…</div>,
});
const SketchLessonFilm = dynamic(() => import('@/components/learning/SketchLessonFilm').then(m => m.default), {
  ssr: false,
  loading: () => <div className="flex aspect-video items-center justify-center rounded-3xl bg-[#fff8ed] text-slate-700"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Opening your sketch lesson…</div>,
});
const PlayableLessonLab = dynamic(() => import('@/components/learning/PlayableLessonLab').then(m => m.PlayableLessonLab), {
  ssr: false,
  loading: () => <div className="flex min-h-80 items-center justify-center rounded-3xl bg-[#f3f1ff] text-slate-700"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Setting up your workshop…</div>,
});

const stations = [
  { id: 'learn', title: 'Watch', subtitle: 'Animated sketch lesson', icon: Play, color: 'bg-orange-100 text-orange-800' },
  { id: 'play', title: 'Experiment', subtitle: 'Your playable 3D studio', icon: Gamepad2, color: 'bg-lime-100 text-lime-800' },
  { id: 'build', title: 'Create', subtitle: 'Your training missions', icon: Hammer, color: 'bg-violet-100 text-violet-800' },
  { id: 'recall', title: 'Remember', subtitle: 'Flashcards + field guide', icon: Layers3, color: 'bg-sky-100 text-sky-800' },
  { id: 'boss', title: 'Master', subtitle: 'The final challenge', icon: Trophy, color: 'bg-amber-100 text-amber-800' },
] as const;
type Station = typeof stations[number]['id'];
type Program = 'sprint' | 'deep-dive' | 'project';

export function LessonExpedition({ course, lesson, autoStartAi = true, onLessonComplete }: {
  course: Course; lesson: Lesson; autoStartAi?: boolean; onLessonComplete?: (payload: { assessmentScore: number }) => void;
}) {
  const { progress, complete } = useQuestProgress(course.id, lesson.id);
  const [station, setStationState] = useState<Station>('learn');
  const [visitedStations, setVisitedStations] = useState<Station[]>(['learn']);
  const setStation = (next: Station) => {
    setStationState(next);
    setVisitedStations(previous => previous.includes(next) ? previous : [...previous, next]);
  };
  const [worldOpen, setWorldOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<'guided' | 'slides' | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [program, setProgram] = useState<Program>('sprint');
  const [goal, setGoal] = useState('');
  const [pack, setPack] = useState<TrainingPack>(() => createLessonTrainingPack(course, lesson, { program: 'sprint' }));
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [recalled, setRecalled] = useState<number[]>([]);
  const [bossAttempt, setBossAttempt] = useState(0);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  const completedStations = stations.filter(s => progress.completed.includes(s.id)).length;
  const bossReady = ['learn', 'play', 'build', 'recall'].every(id => progress.completed.includes(id));
  const masteryQuiz = lesson.assessment.questions.length ? lesson.assessment : lesson.practice.questions.length ? lesson.practice : {
    questions: buildCurriculumGame(course.id, 'quiz-blitz', 'medium', lesson.id)?.quizItems || [],
  };

  const selectProgram = (value: Program) => {
    setProgram(value);
    setPack(createLessonTrainingPack(course, lesson, { program: value, goal }));
    setEvidence({}); setReviewed([]); setRecalled([]); setCardIndex(0); setFlipped(false);
    setNotice('Your mission plan is ready. Customize your quests whenever you want a fresh challenge.');
  };
  const generatePack = async () => {
    const controller = new AbortController();
    requestRef.current?.abort(); requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 70000);
    setGenerating(true); setNotice('');
    try {
      const res = await fetch('/api/ai/training-pack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ courseId: course.id, lessonId: lesson.id, program, goal: goal.trim() || undefined, difficulty: 'medium' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Training materials could not be generated.');
      const next = TrainingPackSchema.parse(data);
      setPack(next); setEvidence({}); setReviewed([]); setRecalled([]); setCardIndex(0); setFlipped(false);
      setNotice(next.source === 'openai' ? 'Your custom quest pack is ready. Let the adventure begin!' : 'A fresh quest pack is unavailable right now. Your course missions are ready to play.');
    } catch (error) {
      if (requestRef.current === controller) setNotice(controller.signal.aborted ? 'Your new quests took too long to prepare. Keep playing your current missions and try again.' : 'Your new quests could not be prepared. Your current missions are still ready to play.');
    } finally { window.clearTimeout(timeout); if (requestRef.current === controller) setGenerating(false); }
  };
  const downloadPack = () => {
    const body = [`# ${pack.title}`, pack.missionBrief, `Quest pack: ${pack.source === 'openai' ? 'Custom quests; review before use' : 'Course missions'}`,
      ...pack.quests.flatMap(q => [`## ${q.title}`, q.instructions, ...q.successCriteria.map(c => `- ${c}`), evidence[q.id] ? `My evidence: ${evidence[q.id]}` : '']),
      '## Flashcards', ...pack.flashcards.map(c => `Q: ${c.front}\nA: ${c.back}`), '## Field guide', ...pack.cheatSheet.map(c => `### ${c.title}\n${c.body}`),
      '## Reflection', ...pack.reflectionPrompts.map(p => `- ${p}`)].join('\n\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${course.id}-${lesson.id}-training.md`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const recallCard = () => {
    const next = [...new Set([...recalled, cardIndex])]; setRecalled(next);
    if (next.length === pack.flashcards.length) complete('recall', 20);
    setFlipped(false); setCardIndex(i => (i + 1) % pack.flashcards.length);
  };

  return (
    <section className="academy-experience space-y-5" aria-label="Lesson expedition">
      <div className="relative overflow-hidden rounded-[28px] border border-[#d8d4c8] bg-[#fff9ee] p-5 text-[#22252b] sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rotate-12 rounded-[64px] border-[30px] border-[#f5d26a]/30" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl"><p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b54730]"><Sparkles className="h-4 w-4" />Watch · Play · Make</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">See the idea take shape. Try it in your studio. Learn from what happens.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/75 px-4 py-3"><div className="rounded-full bg-amber-100 p-2"><Zap className="h-5 w-5 text-amber-600" /></div><div><p className="text-xl font-bold tabular-nums">{progress.xp} <span className="text-xs font-medium text-slate-500">expedition XP</span></p><p className="text-xs text-slate-500">{completedStations}/5 stations · saved on this device</p></div></div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => setWorldOpen(v => !v)} aria-expanded={worldOpen} className="rounded-full border-[#d8d4c8] bg-white text-slate-700"><Compass className="mr-2 h-4 w-4" />{worldOpen ? 'Close island map' : 'Explore the island'}</Button><span className="text-xs text-slate-500">Your studio, your pace. Experiment as often as you like.</span></div>
      </div>

      {worldOpen && <LearningWorld3D activeStation={station} completedStations={progress.completed} onSelectStation={setStation} />}

      <div role="tablist" aria-label="Expedition stations" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stations.map(({ id, title, subtitle, icon: Icon, color }) => (
          <button key={id} id={`station-${lesson.id}-${id}`} role="tab" tabIndex={station === id ? 0 : -1} aria-selected={station === id} aria-controls={`expedition-${lesson.id}-${id}`} onClick={() => setStation(id)} onKeyDown={event => {
            const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!direction && event.key !== 'Home' && event.key !== 'End') return;
            event.preventDefault();
            const current = stations.findIndex(item => item.id === id);
            const next = stations[event.key === 'Home' ? 0 : event.key === 'End' ? stations.length - 1 : (current + direction + stations.length) % stations.length].id;
            setStation(next); document.getElementById(`station-${lesson.id}-${next}`)?.focus();
          }} className={cn('relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500', station === id ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-800 hover:border-teal-400')}>
            <span className={cn('rounded-xl p-2', color)}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-bold">{title}</span><span className={cn('hidden text-[10px] xl:block', station === id ? 'text-slate-300' : 'text-slate-500')}>{subtitle}</span></span>
            {progress.completed.includes(id) && <CheckCircle2 aria-label="Complete" className="absolute right-2 top-2 h-3 w-3 text-teal-500" />}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-[#dedbd2] bg-white p-3 sm:p-5">
        {visitedStations.includes('learn') && <div hidden={station !== 'learn'} role="tabpanel" id={`expedition-${lesson.id}-learn`} aria-labelledby={`station-${lesson.id}-learn`} className="space-y-7">
          <SketchLessonFilm course={course} lesson={lesson} active={station === 'learn'} onComplete={() => complete('learn', 20)} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f4f2fc] p-4"><div><h3 className="text-sm font-semibold text-slate-900">Now make the idea yours.</h3><p className="mt-1 text-xs text-slate-600">Open your workshop and see what changes when you experiment.</p></div><Button onClick={() => setStation('play')} className="rounded-full bg-[#5649bd] hover:bg-[#45389e]">Enter the 3D studio<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          <div className="space-y-4 border-t border-slate-100 pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Keep exploring this lesson</p><div className="flex flex-wrap gap-2"><Button variant="outline" aria-pressed={reviewMode === 'guided'} onClick={() => setReviewMode(reviewMode === 'guided' ? null : 'guided')} className="rounded-full"><BookOpen className="mr-2 h-4 w-4" />Read step by step</Button><Button variant="outline" aria-pressed={reviewMode === 'slides'} onClick={() => setReviewMode(reviewMode === 'slides' ? null : 'slides')} className="rounded-full"><Layers3 className="mr-2 h-4 w-4" />Explore the slide deck</Button></div>
            {reviewMode === 'guided' && <GuidedLessonFlow course={course} lesson={lesson} autoStartAi={autoStartAi && station === 'learn'} onLessonComplete={() => complete('learn', 20)} />}
            {reviewMode === 'slides' && <AILearningClassroom course={course} lesson={lesson} active={station === 'learn'} onReviewComplete={() => complete('learn', 20)} />}
          </div>
        </div>}
        {visitedStations.includes('play') && <div hidden={station !== 'play'} role="tabpanel" id={`expedition-${lesson.id}-play`} aria-labelledby={`station-${lesson.id}-play`} className="space-y-6"><PlayableLessonLab course={course} lesson={lesson} active={station === 'play'} onComplete={score => { if (score >= 80) complete('play', 30); }} /><div className="border-t border-slate-100 pt-5"><Button variant="outline" aria-expanded={practiceOpen} onClick={() => setPracticeOpen(v => !v)} className="rounded-full"><Gamepad2 className="mr-2 h-4 w-4" />{practiceOpen ? 'Close extra practice' : 'Extra practice challenges'}</Button>{practiceOpen && <div className="mt-5"><CourseGamifyPanel courseId={course.id} courseTitle={course.title} courseDescription={course.description} lessonTitles={course.lessons.map(l => l.title)} initialLessonId={lesson.id} /></div>}</div></div>}
        {visitedStations.includes('build') && <div hidden={station !== 'build'} role="tabpanel" id={`expedition-${lesson.id}-build`} aria-labelledby={`station-${lesson.id}-build`} className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-700">03 / Create something real</p><h3 className="mt-2 text-xl font-bold">Creator quests</h3><p className="mt-1 text-sm text-muted-foreground">Turn this lesson into a practical skill, with a plan that fits your time.</p></div><Button variant="outline" onClick={downloadPack}><Download className="mr-2 h-4 w-4" />Save materials</Button></div>
          <div className="grid gap-3 sm:grid-cols-3">{([{ id: 'sprint', title: 'Skill sprint', copy: 'A focused practice session' }, { id: 'deep-dive', title: 'Deep expedition', copy: 'Explore, compare, explain' }, { id: 'project', title: 'Creator program', copy: 'Build a portfolio artifact' }] as const).map(p => <button key={p.id} aria-pressed={program === p.id} disabled={generating} onClick={() => selectProgram(p.id)} className={cn('rounded-2xl border p-4 text-left', program === p.id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:bg-slate-50')}><span className="block text-sm font-bold">{p.title}</span><span className="text-xs text-slate-500">{p.copy}</span></button>)}</div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4"><label htmlFor={`training-goal-${lesson.id}`} className="text-sm font-semibold">What would you like to make or improve?</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={`training-goal-${lesson.id}`} maxLength={500} value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Build an example for my portfolio" className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm" /><Button disabled={generating} onClick={generatePack} className="bg-violet-700 hover:bg-violet-800">{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{generating ? 'Preparing your quests…' : 'Customize my quests'}</Button></div>{notice && <p role="status" className="mt-3 text-sm text-violet-800">{notice}</p>}</div>
          <div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{pack.source === 'openai' ? 'Custom quest pack' : 'Course mission pack'} · ~{pack.estimatedMinutes} min</span><h4 className="mt-3 text-lg font-bold">{pack.title}</h4><p className="mt-1 text-sm leading-relaxed text-slate-600">{pack.missionBrief}</p></div>
          {pack.quests.map((q, index) => <article key={q.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">{index + 1}</span><div className="flex-1"><h5 className="font-bold">{q.title}</h5><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{q.instructions}</p><ul className="my-3 space-y-1 text-xs text-slate-600">{q.successCriteria.map(c => <li key={c} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-violet-500" />{c}</li>)}</ul><label className="block text-xs font-semibold" htmlFor={`evidence-${q.id}`}>Your evidence or reflection</label><textarea id={`evidence-${q.id}`} value={evidence[q.id] || ''} onChange={e => setEvidence(v => ({ ...v, [q.id]: e.target.value }))} maxLength={3000} rows={3} placeholder="Describe what you built, the result, and what you learned." className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" /><label className="mt-2 flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={reviewed.includes(q.id)} onChange={e => setReviewed(v => e.target.checked ? [...v, q.id] : v.filter(id => id !== q.id))} />I reviewed my work against the success criteria.</label></div></div></article>)}
          <Button disabled={progress.completed.includes('build') || !pack.quests.every(q => (evidence[q.id] || '').trim().length >= 20 && reviewed.includes(q.id))} onClick={() => { const saved = complete('build', 30); setNotice(saved ? 'Creator station complete! 30 expedition XP saved on this device.' : 'Could not save this completion on your device. Try again.'); }}><Flag className="mr-2 h-4 w-4" />{progress.completed.includes('build') ? 'Creator station completed' : 'Complete creator station · 30 XP'}</Button>
          <p className="text-xs text-muted-foreground">Project completion is your self-review. Evidence stays in this session; save your materials to keep it.</p>
        </div>}
        {visitedStations.includes('recall') && <div hidden={station !== 'recall'} role="tabpanel" id={`expedition-${lesson.id}-recall`} aria-labelledby={`station-${lesson.id}-recall`} className="space-y-5">
          <div><p className="text-xs font-bold uppercase tracking-widest text-sky-700">04 / Make it stick</p><h3 className="mt-2 text-xl font-bold">Recall lab</h3><p className="mt-1 text-sm text-muted-foreground">Try to answer before revealing the back. Review every card to complete this station.</p></div>
          {pack.flashcards.length > 0 && <><div className="flex justify-between text-xs font-semibold text-slate-500"><span>Card {cardIndex + 1} of {pack.flashcards.length}</span><span>{recalled.length} reviewed</span></div><button aria-label={flipped ? 'Show question' : 'Reveal answer'} aria-pressed={flipped} onClick={() => setFlipped(v => !v)} className="flex min-h-56 w-full flex-col items-center justify-center gap-5 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-violet-50 p-8 text-center"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">{flipped ? 'The explanation' : 'Can you recall?'}</span><span className="max-w-xl whitespace-pre-wrap text-lg font-semibold">{flipped ? pack.flashcards[cardIndex].back : pack.flashcards[cardIndex].front}</span><span className="text-xs text-slate-500">Tap to {flipped ? 'return to the question' : 'reveal the answer'}</span></button><div className="flex flex-wrap items-center justify-center gap-3"><Button variant="outline" onClick={() => { setCardIndex(i => (i - 1 + pack.flashcards.length) % pack.flashcards.length); setFlipped(false); }} aria-label="Previous card"><ChevronLeft className="h-4 w-4" /></Button><Button onClick={recallCard} disabled={!flipped}><Check className="mr-2 h-4 w-4" />Reviewed · next card</Button><Button variant="outline" onClick={() => { setCardIndex(i => (i + 1) % pack.flashcards.length); setFlipped(false); }} aria-label="Next card"><ChevronRight className="h-4 w-4" /></Button></div></>}
          {progress.completed.includes('recall') && <p role="status" className="text-sm font-semibold text-teal-700">Recall station completed. Revisit any card whenever you like.</p>}
          <div className="grid gap-3 sm:grid-cols-2">{pack.cheatSheet.map(item => <article key={item.title} className="rounded-2xl border border-slate-200 p-4"><h4 className="text-sm font-bold">{item.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{item.body}</p></article>)}</div>
          <div className="rounded-2xl bg-amber-50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">Reflection prompts</p>{pack.reflectionPrompts.map(p => <p key={p} className="mt-2 text-sm text-slate-700">{p}</p>)}</div>
          <Button variant="outline" onClick={downloadPack}><Download className="mr-2 h-4 w-4" />Save field guide + flashcards</Button>
        </div>}
        {visitedStations.includes('boss') && <div hidden={station !== 'boss'} role="tabpanel" id={`expedition-${lesson.id}-boss`} aria-labelledby={`station-${lesson.id}-boss`} className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">05 / The mastery gateway</p><h3 className="mt-2 text-xl font-bold">Time to put it all together.</h3><p className="mt-2 text-sm text-slate-600">Complete the four practice stations, then score at least 80% on the lesson assessment. You can retry as often as you need.</p></div>
          {!bossReady ? <div className="grid gap-2 sm:grid-cols-2">{stations.slice(0, 4).map(s => <button key={s.id} onClick={() => setStation(s.id)} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left text-sm"><span>{s.title}</span>{progress.completed.includes(s.id) ? <CheckCircle2 className="h-4 w-4 text-teal-600" /> : <span className="text-xs text-slate-500">Visit station →</span>}</button>)}</div> : <>
            {!lesson.assessment.questions.length && !lesson.practice.questions.length && <p className="text-sm text-muted-foreground">This course has no published assessment. This recall challenge uses its lesson text and project prompts.</p>}
            {masteryQuiz.questions.length ? <InteractiveQuizPlayer key={`${lesson.id}-${bossAttempt}`} quiz={masteryQuiz} mode="assessment" passThreshold={0.8} onComplete={result => { if (result.passed) { complete('boss', 50); onLessonComplete?.({ assessmentScore: result.score }); } }} /> : <p>This lesson needs published assessment questions before the mastery challenge can open.</p>}
            <Button variant="outline" onClick={() => setBossAttempt(v => v + 1)}><RotateCcw className="mr-2 h-4 w-4" />Retry mastery challenge</Button>
          </>}
          {progress.completed.includes('boss') && <p role="status" className="flex items-center gap-2 font-semibold text-teal-700"><Trophy className="h-5 w-5" />Expedition mastered. Your next lesson is waiting.</p>}
        </div>}
      </div>
    </section>
  );
}
