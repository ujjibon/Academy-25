'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type CallbackListener, type PlayerRef } from '@remotion/player';
import { Audio } from '@remotion/media';
import { Check, Captions, Film, Loader2, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { Course, Lesson } from '@/lib/data-provider';
import { buildSketchLessonStoryboard, SKETCH_FAMILY_NAMES, sketchViewingProgress, type SketchLessonStoryboard } from '@/lib/visual-lessons';
import { applySketchNarration, isNarratedSketchManifest, SKETCH_NARRATION_LEAD_MS, type NarratedSketchManifest } from '@/lib/narrated-sketch';
import { SketchLessonComposition } from './SketchLessonComposition';

export { SketchLessonComposition } from './SketchLessonComposition';

type FilmProps = {
  film: SketchLessonStoryboard;
  showCaptions: boolean;
  narration: NarratedSketchManifest | null;
  voiceEnabled: boolean;
  onVoiceError: () => void;
};

function NarratedSketchComposition({ film, showCaptions, narration, voiceEnabled, onVoiceError }: FilmProps) {
  const onMediaError = useCallback((error: Error) => {
    // A native decoder can recover unsupported browser codecs. Missing or
    // unreadable recordings need an explicit repair instead of buffering forever.
    if (/network|fetch|http|container|no .*tracks/i.test(error.message)) onVoiceError();
    return 'fallback' as const;
  }, [onVoiceError]);
  return <>
    <SketchLessonComposition film={film} showCaptions={showCaptions} />
    {narration && voiceEnabled && film.chapters.map(chapter => {
      const clip = narration.chapters.find(item => item.id === chapter.id)!;
      return <Audio key={clip.id} src={clip.url} from={chapter.startFrame + Math.round(SKETCH_NARRATION_LEAD_MS / 1000 * film.fps)} durationInFrames={Math.ceil(clip.durationMs / 1000 * film.fps)} premountFor={film.fps} onError={onMediaError} fallbackHtml5AudioProps={{ onError: onVoiceError, preservePitch: true, pauseWhenBuffering: true }} />;
    })}
  </>;
}

type Props = { course: Course; lesson: Lesson; active?: boolean; onComplete?: () => void };
type VoiceStatus = 'checking' | 'idle' | 'preparing' | 'ready' | 'error' | 'unavailable';

function SketchLessonFilmSession({ course, lesson, active = true, onComplete }: Props) {
  const baseFilm = useMemo(() => buildSketchLessonStoryboard(course, lesson), [course, lesson]);
  const [narration, setNarration] = useState<NarratedSketchManifest | null>(null);
  const [voiceAttempt, setVoiceAttempt] = useState(0);
  const film = useMemo(() => narration ? applySketchNarration(baseFilm, narration) : baseFilm, [baseFilm, narration]);
  const playerRef = useRef<PlayerRef>(null);
  const callbackRef = useRef(onComplete);
  callbackRef.current = onComplete;
  const activeRef = useRef(active);
  activeRef.current = active;
  const viewedRef = useRef(new Uint8Array(film.durationInFrames));
  const completedRef = useRef(false);
  const playingRef = useRef(false);
  const lastRef = useRef<{ frame: number; time: number } | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);
  const voiceRequestRef = useRef<AbortController | null>(null);
  const playAfterLoadRef = useRef(false);
  const startedRef = useRef(false);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('checking');
  const [voiceMessage, setVoiceMessage] = useState('Checking for a saved narration…');
  const [fullscreen, setFullscreen] = useState(false);
  const [coverage, setCoverage] = useState(() => sketchViewingProgress(film, viewedRef.current));
  const currentChapter = Math.max(0, film.chapters.findIndex(chapter => frame >= chapter.startFrame && frame < chapter.startFrame + chapter.durationInFrames));
  const currentCaption = film.captions.find(caption => frame / film.fps * 1000 >= caption.startMs && frame / film.fps * 1000 < caption.endMs);

  // Looking for an existing recording is free of generation side effects.
  useEffect(() => {
    const controller = new AbortController();
    loadRequestRef.current = controller;
    let alive = true;
    const query = new URLSearchParams({ courseId: course.id, lessonId: String(lesson.id) });
    void fetch(`/api/learning/narration?${query}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Saved narration unavailable');
      const result: unknown = await response.json();
      if (!alive || startedRef.current) return;
      if (result && typeof result === 'object' && 'ready' in result && result.ready === true && 'manifest' in result && isNarratedSketchManifest(result.manifest, course.id, Number(lesson.id))) {
        setNarration(result.manifest);
        setVoiceStatus('ready');
        setVoiceMessage('Narration ready. Follow the pencil and listen.');
      } else if (result && typeof result === 'object' && 'available' in result && result.available === false) {
        setVoiceEnabled(false);
        setVoiceStatus('unavailable');
        setVoiceMessage('Narration is unavailable. You can watch with captions.');
      } else {
        setVoiceStatus('idle');
        setVoiceMessage('Press play to prepare this lesson’s narrated sketch.');
      }
    }).catch(() => {
      if (alive && !controller.signal.aborted && !startedRef.current) {
        setVoiceStatus('idle');
        setVoiceMessage('Press play to prepare this lesson’s narrated sketch.');
      }
    });
    return () => {
      alive = false;
      controller.abort();
      const request = voiceRequestRef.current;
      voiceRequestRef.current = null;
      request?.abort();
      playAfterLoadRef.current = false;
      playerRef.current?.pause();
    };
  }, [course.id, lesson.id]);

  // A recorded chapter establishes a new timeline. Start it at the beginning;
  // credit from the earlier silent timeline cannot count toward a longer film.
  useEffect(() => {
    playerRef.current?.pause();
    viewedRef.current = new Uint8Array(film.durationInFrames);
    lastRef.current = null;
    setFrame(0);
    setCoverage(sketchViewingProgress(film, viewedRef.current));
    playerRef.current?.seekTo(0);
    if (narration && playAfterLoadRef.current && activeRef.current && !document.hidden) {
      playAfterLoadRef.current = false;
      const animation = requestAnimationFrame(() => {
        if (activeRef.current && !document.hidden) playerRef.current?.play();
      });
      return () => cancelAnimationFrame(animation);
    }
    playAfterLoadRef.current = false;
  }, [film, narration, voiceAttempt]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const resetSample = () => { lastRef.current = null; };
    const onPlay: CallbackListener<'play'> = () => { playingRef.current = true; setPlaying(true); resetSample(); };
    const onPause: CallbackListener<'pause'> = () => { playingRef.current = false; setPlaying(false); resetSample(); };
    const onSeek: CallbackListener<'seeked'> = () => { resetSample(); };
    const onFullscreen: CallbackListener<'fullscreenchange'> = event => { setFullscreen(event.detail.isFullscreen); };
    let lastUiTime = 0;
    const onFrame: CallbackListener<'frameupdate'> = event => {
      const next = event.detail.frame;
      const now = performance.now();
      const previous = lastRef.current;
      if (playingRef.current && active && !document.hidden && previous) {
        const delta = next - previous.frame;
        const elapsed = now - previous.time;
        const allowed = Math.ceil(elapsed / 1000 * film.fps * speed) + 3;
        if (elapsed >= 0 && elapsed < 600 && delta > 0 && delta <= allowed && delta < film.fps * speed * .7) {
          for (let watched = previous.frame; watched <= next && watched < viewedRef.current.length; watched++) viewedRef.current[watched] = 1;
        }
      }
      lastRef.current = { frame: next, time: now };
      if (now - lastUiTime > 180 || next === film.durationInFrames - 1) {
        lastUiTime = now;
        setFrame(next);
        const status = sketchViewingProgress(film, viewedRef.current);
        setCoverage(status);
        if (status.complete && !completedRef.current) { completedRef.current = true; callbackRef.current?.(); }
      }
    };
    const visibility = () => { resetSample(); if (document.hidden) { playAfterLoadRef.current = false; player.pause(); } };
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('seeked', onSeek);
    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('seeked', onSeek);
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [film, active, speed, voiceAttempt]);

  useEffect(() => { if (!active) { playAfterLoadRef.current = false; playerRef.current?.pause(); } }, [active]);

  const onVoiceError = useCallback(() => {
    playerRef.current?.pause();
    setVoiceStatus('error');
    setVoiceEnabled(false);
    setCaptions(true);
    setVoiceMessage('The voice track could not load. Watch with captions, or retry narration.');
  }, []);

  function seek(next: number) {
    lastRef.current = null;
    playerRef.current?.seekTo(next);
    setFrame(next);
  }

  async function prepareNarration() {
    if (voiceRequestRef.current) return;
    startedRef.current = true;
    loadRequestRef.current?.abort();
    playerRef.current?.pause();
    setVoiceStatus('preparing');
    setVoiceMessage('Preparing five voiced chapters for this lesson… You can switch to captions while they load.');
    const controller = new AbortController();
    voiceRequestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 280_000);
    try {
      const response = await fetch('/api/learning/narration', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, lessonId: Number(lesson.id) }), signal: controller.signal,
      });
      const result: unknown = await response.json();
      if (!response.ok || !isNarratedSketchManifest(result, course.id, Number(lesson.id))) throw new Error('Narration unavailable');
      if (controller.signal.aborted || voiceRequestRef.current !== controller) return;
      playAfterLoadRef.current = true;
      setNarration(result);
      setVoiceEnabled(true);
      setVoiceStatus('ready');
      setVoiceMessage('Narration ready. Follow the pencil and listen.');
    } catch {
      // An unmounted lesson never updates or starts the next lesson’s player.
      if (voiceRequestRef.current === controller && !controller.signal.aborted) {
        setVoiceStatus('error');
        setVoiceMessage('Narration could not be prepared. Retry, or watch the sketch with captions.');
      } else if (voiceRequestRef.current === controller) {
        setVoiceStatus('error');
        setVoiceMessage('Narration took too long. Retry, or watch with captions.');
      }
    } finally {
      window.clearTimeout(timeout);
      if (voiceRequestRef.current === controller) voiceRequestRef.current = null;
    }
  }

  function togglePlayback() {
    if (playing) { playerRef.current?.pause(); return; }
    if (voiceEnabled && !narration && voiceStatus !== 'unavailable') { void prepareNarration(); return; }
    startedRef.current = true;
    loadRequestRef.current?.abort();
    if (frame >= film.durationInFrames - 1) seek(0);
    playerRef.current?.play();
  }

  function watchWithCaptions() {
    playAfterLoadRef.current = false;
    voiceRequestRef.current?.abort();
    voiceRequestRef.current = null;
    loadRequestRef.current?.abort();
    startedRef.current = true;
    setVoiceEnabled(false);
    setCaptions(true);
    if (!narration) { setVoiceStatus('idle'); setVoiceMessage('Watching with captions. Turn narration on when you are ready.'); }
    playerRef.current?.play();
  }

  function retryVoiceTrack() {
    // A new Player also releases a failed media decoder's cached input.
    setVoiceAttempt(value => value + 1);
    setNarration(null);
    setVoiceEnabled(true);
    void prepareNarration();
  }

  const timeLabel = (frames: number) => `${Math.floor(frames / film.fps / 60)}:${String(Math.floor(frames / film.fps) % 60).padStart(2, '0')}`;
  const voicePending = voiceStatus === 'preparing';
  const voiceNeedsPreparation = voiceEnabled && !narration && voiceStatus !== 'unavailable';
  return <section aria-label={`Sketch film: ${lesson.title}`} data-narration={voiceStatus} data-narrated={Boolean(narration)} className="overflow-hidden rounded-[1.25rem] border border-[#e0e3e9] bg-[#fcfcfd] text-[#20242b] shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e3e9] px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#335cff] text-white"><Film className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#335cff]">Watch & learn</p><h3 className="text-lg font-bold">The sketch studio</h3></div></div><span className="rounded-full border border-[#e0e3e9] bg-white/70 px-3 py-1 text-xs font-semibold">{SKETCH_FAMILY_NAMES[film.family]} · {timeLabel(film.durationInFrames)}</span></div>
    <div className="relative bg-[#fcfcfd]"><Player key={`${narration?.id || 'silent'}:${voiceAttempt}`} ref={playerRef} component={NarratedSketchComposition} inputProps={{ film, showCaptions: captions && fullscreen, narration, voiceEnabled: voiceEnabled && active, onVoiceError }} durationInFrames={film.durationInFrames} compositionWidth={1280} compositionHeight={960} fps={film.fps} playbackRate={speed} controls={fullscreen} showVolumeControls={Boolean(narration)} moveToBeginningWhenEnded={false} showPlaybackRateControl={false} clickToPlay={fullscreen && !voiceNeedsPreparation && !voicePending} allowFullscreen={!voiceNeedsPreparation && !voicePending} spaceKeyToPlayOrPause={false} style={{ width: '100%' }} errorFallback={() => <div className="flex h-full items-center justify-center p-8 text-center">The film could not start. Use the chapter transcript below, then reload to try playback again.</div>} /></div>
    <div className="space-y-4 border-t border-[#e0e3e9] px-5 py-4 sm:px-6">
      {captions && <p aria-live="off" className="min-h-12 rounded-xl bg-[#20242b] px-4 py-3 text-sm font-medium leading-relaxed text-[#ffffff] sm:text-base">{currentCaption?.text || film.chapters[currentChapter].title}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={togglePlayback} disabled={!active || voicePending || (voiceEnabled && voiceStatus === 'checking')} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#20242b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{voicePending ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{voicePending ? 'Preparing narration…' : playing ? 'Pause' : voiceNeedsPreparation && voiceStatus === 'error' ? 'Retry narration' : frame > 0 ? 'Resume film' : narration && voiceEnabled ? 'Play narrated sketch' : 'Play the sketch'}</button>
        <button type="button" aria-label="Replay this sketch film from the beginning" onClick={() => seek(0)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e0e3e9] bg-white/70"><RotateCcw className="h-4 w-4" /></button>
        <button type="button" aria-pressed={captions} onClick={() => setCaptions(value => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e0e3e9] bg-white/70 px-3 text-sm"><Captions className="h-4 w-4" />Captions {captions ? 'on' : 'off'}</button>
        <button type="button" aria-pressed={voiceEnabled} onClick={() => { if (voicePending) watchWithCaptions(); else { setVoiceEnabled(value => !value); if (!voiceEnabled && !narration) { playerRef.current?.pause(); setVoiceStatus('idle'); setVoiceMessage('Press play to prepare this lesson’s narrated sketch.'); } } }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e0e3e9] bg-white/70 px-3 text-sm">{voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}Narration {voiceEnabled ? 'on' : 'off'}</button>
        <button type="button" aria-label={fullscreen ? 'Exit fullscreen film' : 'View film fullscreen'} disabled={!fullscreen && (voiceNeedsPreparation || voicePending)} title={voiceNeedsPreparation ? 'Prepare narration or choose captions before fullscreen' : undefined} onClick={() => { if (fullscreen) playerRef.current?.exitFullscreen(); else playerRef.current?.requestFullscreen(); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e0e3e9] bg-white/70 px-3 text-sm">{fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}Fullscreen</button>
        <label className="ml-auto flex min-h-10 items-center gap-2 text-sm font-medium">Speed<select aria-label="Film playback speed" value={speed} onChange={event => setSpeed(Number(event.target.value))} className="rounded-lg border border-[#e0e3e9] bg-white px-2 py-1.5">{[.75, 1, 1.25, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f0f3fa] px-3 py-2.5 text-xs leading-relaxed"><div><p role="status" className="font-medium text-[#454c58]">{voiceMessage}</p><p className="text-[#596273]">AI-generated narration · Drawn step by step for this lesson</p></div>{!narration && voiceEnabled && <button type="button" onClick={watchWithCaptions} className="min-h-9 shrink-0 rounded-lg border border-[#e0e3e9] bg-white px-3 font-semibold">Watch with captions</button>}{voiceStatus === 'error' && narration && <button type="button" onClick={retryVoiceTrack} className="min-h-9 rounded-lg border border-[#e0e3e9] bg-white px-3 font-semibold">Retry voice track</button>}</div>
      <label className="flex items-center gap-3"><span className="min-w-20 text-xs font-semibold tabular-nums">{timeLabel(frame)} / {timeLabel(film.durationInFrames)}</span><input type="range" min={0} max={film.durationInFrames - 1} value={frame} aria-label="Seek through the sketch film" aria-valuetext={`${timeLabel(frame)} of ${timeLabel(film.durationInFrames)}`} onChange={event => seek(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-[#335cff]" /></label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Film chapters">{film.chapters.map((chapter, index) => <button key={chapter.id} type="button" onClick={() => seek(chapter.startFrame)} aria-current={currentChapter === index ? 'step' : undefined} className={`min-h-16 rounded-xl border px-3 py-2 text-left transition-colors ${currentChapter === index ? 'border-[#335cff] bg-[#e1e9ff]' : 'border-[#e0e3e9] bg-white/60 hover:bg-white'}`}><span className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#596273]">{timeLabel(chapter.startFrame)}{coverage.chapterCoverage[index] >= .7 && <Check className="h-3 w-3 text-[#335cff]" />}</span><span className="block text-xs font-semibold leading-snug">{chapter.title}</span></button>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><p className="text-[#596273]">Pause to predict. Replay a drawing. Then build your own version.</p><p role="status" className={`font-semibold ${coverage.complete ? 'text-[#335cff]' : 'text-[#596273]'}`}>{coverage.complete ? 'Film explored ✓' : `${Math.round(coverage.ratio * 100)}% watched`}</p></div>
      <details className="rounded-xl border border-[#e0e3e9] bg-white/60 p-4"><summary className="cursor-pointer text-sm font-semibold">Chapter transcript & project brief</summary><div className="mt-4 space-y-4">{film.chapters.map(chapter => <div key={chapter.id}><button type="button" onClick={() => seek(chapter.startFrame)} className="text-left text-sm font-bold text-[#335cff]">{timeLabel(chapter.startFrame)} · {chapter.title}</button><p className="mt-1 text-sm leading-relaxed text-[#454c58]">{chapter.narration}</p></div>)}<p className="border-t border-[#e0e3e9] pt-3 text-xs leading-relaxed text-[#596273]">The drawings explain this lesson’s teaching and project. Small data and code examples are illustrative. Recorded narration follows each chapter; captions follow the chapter’s spoken text.</p></div></details>
    </div>
  </section>;
}

export function SketchLessonFilm(props: Props) {
  return <SketchLessonFilmSession key={`${props.course.id}:${props.lesson.id}`} {...props} />;
}

export default SketchLessonFilm;
