'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Gamepad2 } from 'lucide-react';
import { courses } from '@/lib/courses';
import { getCourse, type Course } from '@/lib/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { LessonExpedition } from '@/components/learning/LessonExpedition';
import { cn } from '@/lib/utils';
import { buildLearningGamePlan, gameKindLabels } from '@/lib/learning-game-catalog';

export function LearningAdventure({ fixedCourse }: { fixedCourse?: Course }) {
  const { userProfile } = useAuth();
  const available = courses.map(c => getCourse(c.id)).filter((c): c is Course => Boolean(c?.lessons.length));
  const [courseId, setCourseId] = useState(fixedCourse?.id || userProfile?.activeCourseId || available[0]?.id || 'masters-codex');
  const course = fixedCourse || available.find(c => c.id === courseId) || available[0];
  const [lessonId, setLessonId] = useState(fixedCourse?.lessons[0]?.id || (userProfile?.activeCourseId === course?.id ? userProfile?.activeLessonId : undefined) || course?.lessons[0]?.id || '1');
  const lesson = course?.lessons.find(l => l.id === lessonId) || course?.lessons[0];
  if (!course || !lesson) return <p>Choose a course with published lessons to start playing.</p>;
  const index = course.lessons.findIndex(l => l.id === lesson.id);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 text-[#20242b]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-medium text-[#335cff]">Academy / Play & learn</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">A new idea. A different game.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">Mix a soundtrack. Run a loop. Frame a shot. Try the skill in a playground made for the lesson.</p></div>
        <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-2 py-2 text-sm font-medium text-slate-500 hover:text-[#335cff]">Course overview<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="adventure-course" className="text-xs font-medium text-slate-500">Course</label><select id="adventure-course" disabled={Boolean(fixedCourse)} value={course.id} onChange={e => { const next = getCourse(e.target.value); setCourseId(e.target.value); setLessonId(next?.lessons[0]?.id || '1'); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium">{(fixedCourse ? [fixedCourse] : available).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <div><label htmlFor="adventure-lesson" className="text-xs font-medium text-slate-500">Lesson</label><select id="adventure-lesson" value={lesson.id} onChange={e => setLessonId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium">{course.lessons.map((l, i) => <option key={l.id} value={l.id}>{i + 1}. {l.title}</option>)}</select></div>
      </div>
      <div><div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>Explore the games in this course</span><span>Lesson {index + 1} of {course.lessons.length}</span></div><div className="flex items-stretch gap-2 overflow-x-auto pb-2" aria-label="Course lessons">{course.lessons.map((l, i) => {
        const games = buildLearningGamePlan(course, l).challenges;
        return <button key={l.id} aria-current={l.id === lesson.id ? 'step' : undefined} onClick={() => setLessonId(l.id)} title={l.title} className={cn('w-[225px] shrink-0 rounded-xl border p-3 text-left transition', l.id === lesson.id ? 'border-[#335cff]/40 bg-white' : 'border-slate-200/70 bg-white/60 hover:bg-white')}><span className={cn('text-[10px] font-semibold', l.id === lesson.id ? 'text-[#335cff]' : 'text-slate-400')}>LESSON {i + 1}</span><span className="mt-1 block line-clamp-2 min-h-9 text-xs font-semibold leading-relaxed text-slate-700">{l.title}</span><span className="mt-2 block text-[10px] leading-relaxed text-slate-500">{games.map(game => gameKindLabels[game.kind]).join(' · ')}</span></button>;
      })}</div></div>
      <LessonExpedition key={`${course.id}:${lesson.id}`} course={course} lesson={lesson} autoStartAi={false} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500"><p>Practice XP is saved here. Complete the lesson check to save course progress.</p><Link href={`/courses/${course.id}/${lesson.id}`} className="inline-flex items-center gap-1 font-medium text-[#335cff]">Open lesson<ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
    </div>
  );
}

export function AdventureInvitation() {
  return <Link href="/learn/adventure" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-[#20242b]"><div><p className="flex items-center gap-2 text-xs font-medium text-[#335cff]"><Gamepad2 className="h-4 w-4" />Play & learn</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Make your next lesson a game.</h2><p className="mt-1 text-sm text-slate-500">From mixing audio to solving code: a different way to play each skill.</p></div><span className="flex items-center gap-2 rounded-full bg-[#335cff] px-4 py-2 text-sm font-medium text-white">Start playing<ArrowUpRight className="h-4 w-4" /></span></Link>;
}
