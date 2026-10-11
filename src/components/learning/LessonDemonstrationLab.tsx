'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Code2, Lightbulb, Loader2, Pause, Play, RotateCcw, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Course, Lesson } from '@/lib/data-provider';
import { getLessonDemonstration } from '@/lib/lesson-demonstrations';
import { LessonTryResultSchema, type LessonTryResult } from '@/lib/lesson-try';
import { TeachingCharacter } from '@/components/learning/SketchTeachingCast';
import { LessonCodePreview } from '@/components/learning/LessonCodePreview';
import { cn } from '@/lib/utils';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#335cff] focus-visible:ring-offset-2';

/** Authored demonstrations teach the lesson; only the explicit Try button requests a new result. */
export function LessonDemonstrationLab({ course, lesson, active = true }: { course: Course; lesson: Lesson; active?: boolean }) {
  const demonstration = useMemo(() => getLessonDemonstration(course, lesson), [course, lesson]);
  const inputId = useId();
  const predictionId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [predictionRevealed, setPredictionRevealed] = useState(false);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [traceIndex, setTraceIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [prompt, setPrompt] = useState(demonstration.prompt.starter);
  const [result, setResult] = useState<LessonTryResult | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const revisionRef = useRef(0);

  useEffect(() => {
    revisionRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setStepIndex(0); setPrediction(null); setPredictionRevealed(false);
    setExperimentId(null); setTraceIndex(-1); setPlaying(false);
    setPrompt(demonstration.prompt.starter); setResult(null); setSubmittedPrompt(''); setGenerating(false); setError('');
    return () => {
      revisionRef.current += 1;
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [demonstration.id, demonstration.prompt.starter]);

  const experiment = demonstration.experiments.find(item => item.id === experimentId);
  const lines = experiment ? experiment.lines ?? [] : demonstration.code?.lines ?? [];
  const trace = experiment ? experiment.trace ?? [] : demonstration.code?.trace ?? [];
  const hasTrace = lines.length > 0 && trace.length > 0;
  const currentTrace = traceIndex >= 0 ? trace[traceIndex] : null;
  const finished = trace.length > 0 && traceIndex === trace.length - 1;
  const currentStep = demonstration.steps[stepIndex];

  useEffect(() => {
    if (!active) {
      setPlaying(false);
      revisionRef.current += 1;
      requestRef.current?.abort();
      requestRef.current = null;
      setGenerating(false);
    }
  }, [active]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  useEffect(() => {
    if (!playing || !active || !trace.length) return;
    if (traceIndex >= trace.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setTraceIndex(index => Math.min(index + 1, trace.length - 1)), 1900);
    return () => window.clearTimeout(timer);
  }, [playing, active, traceIndex, trace.length]);

  const changePrompt = (value: string) => {
    revisionRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setPrompt(value.slice(0, 1800)); setResult(null); setSubmittedPrompt(''); setGenerating(false); setError('');
  };

  const tryPrompt = async () => {
    if (!active || generating || requestRef.current || prompt.trim().length < 8) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const revision = ++revisionRef.current;
    const text = prompt.trim();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    setGenerating(true); setResult(null); setSubmittedPrompt(''); setError('');
    try {
      const response = await fetch('/api/learning/try', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ courseId: course.id, lessonId: Number(lesson.id), prompt: text }),
      });
      const data: unknown = await response.json();
      if (revisionRef.current !== revision || requestRef.current !== controller) return;
      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'Your result could not be prepared. Try again.';
        throw new Error(message);
      }
      const parsed = LessonTryResultSchema.safeParse(data);
      if (!parsed.success) throw new Error('The result was incomplete. Your prompt is saved; try again.');
      setResult(parsed.data); setSubmittedPrompt(text);
    } catch (cause) {
      if (revisionRef.current === revision && requestRef.current === controller) {
        setError(controller.signal.aborted ? 'This took longer than expected. Your prompt is still here; try again.' : cause instanceof Error ? cause.message : 'Your result could not be prepared. Your prompt is still here; try again.');
      }
    } finally {
      window.clearTimeout(timeout);
      if (revisionRef.current === revision && requestRef.current === controller) {
        requestRef.current = null;
        setGenerating(false);
      }
    }
  };

  const chooseExperiment = (id: string | null) => { setExperimentId(id); setTraceIndex(-1); setPlaying(false); };

  return (
    <section aria-label="Learn by trying" data-lesson-demonstration={demonstration.id} className="space-y-8 text-[#20242b]">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#335cff]">See it · change it · understand it</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{demonstration.goal}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{demonstration.concept}</p>
        </div>
        <div className="flex items-start gap-3 self-center rounded-2xl bg-[#f4f6fb] p-5">
          <div className="h-16 w-14 shrink-0"><TeachingCharacter name="maya" /></div>
          <div><p className="mb-2 text-xs font-medium text-[#335cff]">Maya · Guide</p><div className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-[#335cff]" />Why this matters</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{demonstration.why}</p></div>
        </div>
      </div>

      <article aria-label="Worked example" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">01 / Follow the idea</p><h4 className="mt-2 text-xl font-semibold">A worked example, with the reasons.</h4></div>
          <span className="shrink-0 text-xs tabular-nums text-slate-500">{stepIndex + 1} / {demonstration.steps.length}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)]">
          <div aria-label="Example steps" className="space-y-2">
            {demonstration.steps.map((step, index) => (
              <button key={`${demonstration.id}-${index}`} type="button" aria-pressed={stepIndex === index} onClick={() => setStepIndex(index)} className={cn('flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors', focusRing, stepIndex === index ? 'border-[#335cff] bg-[#f4f6ff]' : 'border-slate-200 bg-white hover:bg-slate-50')}>
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', stepIndex === index ? 'bg-[#335cff] text-white' : 'bg-slate-100 text-slate-500')}>{index + 1}</span>
                <span className="min-w-0"><span className="block text-sm font-semibold">{step.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{step.action}</span></span>
              </button>
            ))}
          </div>
          {currentStep && <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#335cff]">What you see</p>
            <pre className="mt-3 min-h-24 whitespace-pre-wrap break-words rounded-xl bg-[#f6f7fa] p-4 font-mono text-sm leading-6">{currentStep.visibleResult}</pre>
            <p className="mt-5 text-sm font-semibold">Why that happened</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{currentStep.reason}</p>
            <div className="mt-auto flex justify-between gap-3 pt-5">
              <Button type="button" variant="outline" size="sm" disabled={stepIndex === 0} onClick={() => setStepIndex(index => Math.max(0, index - 1))}><ChevronLeft />Previous step</Button>
              <Button type="button" size="sm" disabled={stepIndex === demonstration.steps.length - 1} onClick={() => setStepIndex(index => Math.min(demonstration.steps.length - 1, index + 1))} className="bg-[#335cff] hover:bg-[#2448d6]">Next step<ChevronRight /></Button>
            </div>
          </div>}
        </div>
      </article>

      <article aria-labelledby={predictionId} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">02 / Make a prediction</p>
        <div className="mt-3 flex items-center gap-3"><div className="h-12 w-11 shrink-0"><TeachingCharacter name="leo" /></div><div><p className="text-xs font-medium text-slate-500">Leo wants to know…</p><h4 id={predictionId} className="mt-1 text-lg font-semibold">{demonstration.prediction.question}</h4></div></div>
        <p className="mt-2 text-xs text-slate-500">Choose what you think will happen, then reveal the explanation.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {demonstration.prediction.options.map(option => <button type="button" key={option} aria-pressed={prediction === option} onClick={() => { setPrediction(option); setPredictionRevealed(false); }} className={cn('rounded-xl border px-4 py-3 text-left text-sm leading-6', focusRing, prediction === option ? 'border-[#335cff] bg-[#f4f6ff]' : 'border-slate-200 hover:bg-slate-50')}>{option}</button>)}
        </div>
        <Button type="button" variant="outline" disabled={prediction === null} onClick={() => setPredictionRevealed(true)} className="mt-4">Check my reasoning<ArrowRight /></Button>
        {predictionRevealed && <div role="status" className="mt-4 rounded-2xl bg-[#f4f6fb] p-4">
          <p className="text-sm font-semibold">{prediction === demonstration.prediction.answer ? 'You predicted it.' : 'Here is the useful difference.'}</p>
          {prediction !== demonstration.prediction.answer && <p className="mt-2 text-sm leading-6"><span className="font-medium">What happens: </span>{demonstration.prediction.answer}</p>}
          <p className="mt-2 text-sm leading-7 text-slate-600">{demonstration.prediction.explanation}</p>
        </div>}
      </article>

      {demonstration.code && <article aria-label="Programming demonstration" className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">03 / Follow the program</p><h4 className="mt-2 text-xl font-semibold">One line. One change. See what happens.</h4><p className="mt-2 text-sm leading-6 text-slate-600">Step through this worked example. The highlight shows the line being executed; the panels show its effect.</p></div>
        {demonstration.experiments.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Programming examples">
          <button type="button" aria-pressed={experimentId === null} onClick={() => chooseExperiment(null)} className={cn('rounded-full border px-4 py-2 text-xs font-medium', focusRing, experimentId === null ? 'border-[#335cff] bg-[#f4f6ff] text-[#335cff]' : 'border-slate-200 hover:bg-slate-50')}>Original example</button>
          {demonstration.experiments.map(item => <button type="button" key={item.id} aria-pressed={experimentId === item.id} onClick={() => chooseExperiment(item.id)} className={cn('rounded-full border px-4 py-2 text-xs font-medium', focusRing, experimentId === item.id ? 'border-[#335cff] bg-[#f4f6ff] text-[#335cff]' : 'border-slate-200 hover:bg-slate-50')}>{item.label}</button>)}
        </div>}
        {experiment && <p className="rounded-xl bg-[#f4f6fb] px-4 py-3 text-sm leading-6"><span className="font-semibold">Changed input: </span>{experiment.input}</p>}
        {experiment && !hasTrace && <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#335cff]">Authored comparison</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{experiment.result}</p><p className="mt-4 text-sm font-semibold">Why the result changes</p><p className="mt-2 text-sm leading-7 text-slate-600">{experiment.reason}</p><p className="mt-3 text-xs text-slate-500">This comparison illustrates a changed case. Choose Original example to follow the program's execution trace.</p></div>}
        {hasTrace && <><div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-[#f7f8fb] px-4 py-3 text-xs"><span className="flex items-center gap-2 font-semibold"><Code2 className="h-4 w-4 text-[#335cff]" />{demonstration.code.language}</span><span className="text-slate-500">Worked example</span></div>
            <div className={cn('overflow-x-auto py-3', focusRing)} tabIndex={0} aria-label="Program source">
              {lines.map((line, index) => <div key={index} className={cn('flex min-w-max gap-3 px-4 py-1.5 font-mono text-xs leading-6 sm:text-sm', currentTrace?.line === index ? 'bg-[#eaf0ff] text-[#213fb5]' : 'text-[#303640]')} aria-current={currentTrace?.line === index ? 'step' : undefined}><span className="w-6 shrink-0 select-none text-right text-slate-400">{index + 1}</span><code className="whitespace-pre">{line || ' '}</code>{currentTrace?.line === index && <span aria-hidden="true" className="ml-2 text-[#335cff]">←</span>}</div>)}
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Values right now</p><pre className="mt-2 min-h-10 whitespace-pre-wrap break-words font-mono text-sm leading-6">{currentTrace?.state || 'Step forward to see the values change.'}</pre></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Output</p><pre className="mt-2 min-h-10 whitespace-pre-wrap break-words font-mono text-sm leading-6">{currentTrace ? currentTrace.output || 'Nothing printed at this step.' : 'The program has not started yet.'}</pre></div>
            <LessonCodePreview language={demonstration.code.language} lines={lines} executedLine={currentTrace?.line ?? null} output={currentTrace?.output ?? ''} />
            <div className="flex items-start gap-3 rounded-2xl bg-[#f4f6ff] p-4"><div className="h-12 w-11 shrink-0"><TeachingCharacter name="pip" /></div><div><p className="text-xs font-medium text-[#335cff]">Pip explains</p><p className="mt-1 text-sm font-semibold">Why this line matters</p><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{currentTrace?.explanation || 'Start with the first line. Read its effect before moving to the next one.'}</p></div></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!active || !trace.length} onClick={() => { if (finished && !playing) setTraceIndex(-1); setPlaying(value => !value); }}>{playing ? <Pause /> : <Play />}{playing ? 'Pause trace' : finished ? 'Replay trace' : 'Play trace'}</Button>
            <Button type="button" variant="outline" size="sm" disabled={!active || traceIndex < 0} onClick={() => { setPlaying(false); setTraceIndex(index => Math.max(-1, index - 1)); }}><ChevronLeft />Back</Button>
            <Button type="button" size="sm" disabled={!active || finished || !trace.length} onClick={() => { setPlaying(false); setTraceIndex(index => Math.min(trace.length - 1, index + 1)); }} className="bg-[#335cff] hover:bg-[#2448d6]">Next line<ChevronRight /></Button>
            <Button type="button" variant="ghost" size="sm" disabled={traceIndex === -1 && !playing} onClick={() => { setPlaying(false); setTraceIndex(-1); }}><RotateCcw />Reset</Button>
          </div>
          <span className="text-xs tabular-nums text-slate-500">{Math.max(0, traceIndex + 1)} / {trace.length} execution steps</span>
        </div>
        <p className="sr-only" role="status" aria-atomic="true">{!playing && currentTrace ? `Execution step ${traceIndex + 1}. Line ${currentTrace.line + 1}. ${currentTrace.explanation} Values: ${currentTrace.state}. Output: ${currentTrace.output || 'Nothing printed.'}` : ''}</p>
        {finished && experiment && <div role="status" className="rounded-2xl bg-[#f4f6fb] p-4"><p className="text-sm font-semibold">Compare the result</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{experiment.result}</p><p className="mt-2 text-sm leading-7 text-slate-600">{experiment.reason}</p></div>}</>}
      </article>}

      {!demonstration.code && demonstration.experiments.length > 0 && <article aria-label="Compare a change" className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">03 / Change one thing</p><h4 className="mt-2 text-xl font-semibold">Compare what changes, and why.</h4></div>
        <div className="flex flex-wrap gap-2">{demonstration.experiments.map(item => <button type="button" key={item.id} aria-pressed={experimentId === item.id} onClick={() => chooseExperiment(item.id)} className={cn('rounded-full border px-4 py-2 text-xs font-medium', focusRing, experimentId === item.id ? 'border-[#335cff] bg-[#f4f6ff] text-[#335cff]' : 'border-slate-200 hover:bg-slate-50')}>{item.label}</button>)}</div>
        {experiment ? <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Change</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{experiment.input}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Result</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{experiment.result}</p></div><div className="rounded-xl bg-[#f4f6fb] p-4"><p className="text-sm font-semibold">The reason</p><p className="mt-2 text-sm leading-7 text-slate-600">{experiment.reason}</p></div></div> : <p className="rounded-xl bg-[#f4f6fb] px-4 py-3 text-sm text-slate-600">Choose a change above to inspect its result.</p>}
      </article>}

      <article aria-label="Try a lesson prompt" className="space-y-4 border-t border-slate-200 pt-7">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">04 / Try your own instruction</p><h4 className="mt-2 text-xl font-semibold">Tell it what you mean. Inspect what it makes.</h4><p className="mt-2 text-sm leading-6 text-slate-600">Compare the starting prompt with the improved version, then edit it to make an example for this lesson.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Editable prompt</span></div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" aria-pressed={prompt === demonstration.prompt.starter} onClick={() => changePrompt(demonstration.prompt.starter)}>Starting prompt</Button><Button type="button" size="sm" variant="outline" aria-pressed={prompt === demonstration.prompt.improved} onClick={() => changePrompt(demonstration.prompt.improved)}><Sparkles />Improved prompt</Button></div>
            <label htmlFor={inputId} className="mt-5 block text-sm font-semibold">Your prompt</label>
            <textarea id={inputId} value={prompt} maxLength={1800} rows={8} spellCheck onChange={event => changePrompt(event.target.value)} className={cn('mt-2 w-full resize-y rounded-xl border border-slate-200 bg-[#fcfcfd] p-3 text-sm leading-6', focusRing)} aria-describedby={`${inputId}-hint`} />
            <div className="mt-2 flex items-start justify-between gap-3"><p id={`${inputId}-hint`} className="text-xs leading-5 text-slate-500">Keep your request connected to {lesson.title.toLowerCase()}. Use at least 8 characters. Changing the prompt clears the previous result.</p><span className="shrink-0 text-xs tabular-nums text-slate-400">{prompt.length}/1800</span></div>
            <Button type="button" disabled={!active || generating || prompt.trim().length < 8} onClick={tryPrompt} className="mt-4 bg-[#335cff] hover:bg-[#2448d6]">{generating ? <Loader2 className="animate-spin" /> : <Send />}{generating ? 'Making your result…' : error ? 'Try prompt again' : 'Try prompt'}</Button>
            {generating && <p role="status" className="mt-3 text-xs text-slate-500">Preparing an example and explaining how it follows your instruction.</p>}
            {error && <p role="alert" className="mt-3 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700">{error}</p>}
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#335cff]">{result ? 'Your result' : 'Illustrated result'}</p>
            {!result && <p className="mt-2 text-xs leading-5 text-slate-500">This authored example shows what the improved prompt is asking for. Try your prompt to create a new result.</p>}
            {result && <p role="status" className="mt-2 text-xs text-slate-500">Your result is ready. Read it, then review the reasons below.</p>}
            <pre className="mt-4 max-h-[32rem] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[#f6f7fa] p-4 font-mono text-sm leading-7">{result?.output ?? demonstration.prompt.sampleOutput}</pre>
            <p className="mt-5 text-sm font-semibold">{result ? 'How your instruction shaped this' : 'Why the improved prompt helps'}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{result?.explanation ?? demonstration.prompt.whyBetter}</p>
            {result && <>
              <div className="mt-4 space-y-3" aria-label="Result review">{result.checks.map((check, index) => <div key={index} className="flex items-start gap-2"><span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', check.passed ? 'bg-[#eaf0ff] text-[#335cff]' : 'bg-slate-100 text-slate-500')}>{check.passed ? <Check className="h-3 w-3" /> : <span className="text-xs">?</span>}</span><div><p className="text-xs font-semibold">{check.label} · {check.passed ? 'Met' : 'Review'}</p><p className="mt-1 text-xs leading-5 text-slate-500">{check.reason}</p></div></div>)}</div>
              <div className="mt-5 rounded-xl bg-[#f4f6ff] p-4"><p className="text-sm font-semibold">Try one more change</p><p className="mt-2 text-sm leading-6 text-slate-600">{result.nextTry}</p></div>
              <details className="mt-4 text-xs text-slate-500"><summary className={cn('cursor-pointer rounded py-1 font-medium', focusRing)}>Prompt used for this result</summary><p className="mt-2 whitespace-pre-wrap leading-6">{submittedPrompt}</p></details>
            </>}
          </div>
        </div>
      </article>

      <div className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2">
        <div className="rounded-2xl bg-[#f4f6fb] p-5"><p className="text-sm font-semibold">A common misunderstanding</p><p className="mt-2 text-sm leading-6 text-slate-500">“{demonstration.misconception.belief}”</p><p className="mt-3 text-sm leading-7">{demonstration.misconception.correction}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold">Now use it somewhere new</p><p className="mt-2 text-sm leading-7 text-slate-600">{demonstration.transfer}</p></div>
      </div>
    </section>
  );
}

export default LessonDemonstrationLab;
