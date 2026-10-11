'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clapperboard, GraduationCap, Move3D } from 'lucide-react';
import { courses } from '@/lib/courses';
import { getCourse, type Course } from '@/lib/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { LessonExpedition } from '@/components/learning/LessonExpedition';
import { cn } from '@/lib/utils';

export function LearningAdventure({ fixedCourse }: { fixedCourse?: Course }) {
  const { userProfile } = useAuth();
  const available = courses.map(c => getCourse(c.id)).filter((c): c is Course => Boolean(c?.lessons.length));
  const [courseId, setCourseId] = useState(fixedCourse?.id || userProfile?.activeCourseId || available[0]?.id || 'masters-codex');
  const course = fixedCourse || available.find(c => c.id === courseId) || available[0];
  const [lessonId, setLessonId] = useState(fixedCourse?.lessons[0]?.id || (userProfile?.activeCourseId === course?.id ? userProfile?.activeLessonId : undefined) || course?.lessons[0]?.id || '1');
  const lesson = course?.lessons.find(l => l.id === lessonId) || course?.lessons[0];
  if (!course || !lesson) return <p>Choose a course with published lessons to start an expedition.</p>;
  const index = course.lessons.findIndex(l => l.id === lesson.id);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#b54730]"><Clapperboard className="h-4 w-4" />Academy / The learning studio</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Watch it. Try it. Understand it.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">Sketch stories bring your lessons to life. Step into a little 3D world, move things around, and learn from what happens.</p></div>
        <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold">Course overview<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-4 rounded-3xl border border-[#dedbd2] bg-[#fffaf1] p-5 sm:grid-cols-2">
        <div><label htmlFor="adventure-course" className="text-xs font-bold uppercase tracking-wider text-slate-500">Choose your studio</label><select id="adventure-course" disabled={Boolean(fixedCourse)} value={course.id} onChange={e => { const next = getCourse(e.target.value); setCourseId(e.target.value); setLessonId(next?.lessons[0]?.id || '1'); }} className="mt-2 w-full rounded-xl border border-[#dedbd2] bg-white px-3 py-3 text-sm font-semibold">{(fixedCourse ? [fixedCourse] : available).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <div><label htmlFor="adventure-lesson" className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's lesson</label><select id="adventure-lesson" value={lesson.id} onChange={e => setLessonId(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dedbd2] bg-white px-3 py-3 text-sm font-semibold">{course.lessons.map((l, i) => <option key={l.id} value={l.id}>{i + 1}. {l.title}</option>)}</select></div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto py-1" aria-label="Course mission map">{course.lessons.map((l, i) => <button key={l.id} aria-current={l.id === lesson.id ? 'step' : undefined} onClick={() => setLessonId(l.id)} title={l.title} className={cn('flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold', l.id === lesson.id ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-500')}>{i + 1}</button>)}<span className="ml-2 shrink-0 text-xs text-muted-foreground">Mission {index + 1} / {course.lessons.length}</span></div>
      <LessonExpedition key={`${course.id}:${lesson.id}`} course={course} lesson={lesson} autoStartAi={false} />
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"><p className="flex items-center gap-2 font-semibold"><GraduationCap className="h-4 w-4 text-teal-700" />Ready to save your course progress?</p><p className="mt-1 text-muted-foreground">Expedition XP tracks practice on this device. Continue in the lesson to complete the course assessment and sync your learning.</p><Link href={`/courses/${course.id}/${lesson.id}`} className="mt-3 inline-flex items-center gap-2 font-semibold text-teal-700">Open this lesson<ArrowUpRight className="h-4 w-4" /></Link></div>
    </div>
  );
}

export function AdventureInvitation() {
  return <Link href="/learn/adventure" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#dedbd2] bg-[#fff9ee] p-5"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#b54730]"><Move3D className="h-4 w-4" />Your watch-and-play studio</p><h2 className="mt-2 text-xl font-bold">See the idea. Bring it to life.</h2><p className="mt-1 text-sm text-slate-600">Animated sketch lessons and playable 3D experiments for every course.</p></div><span className="flex items-center gap-2 rounded-full bg-[#5649bd] px-4 py-2 text-sm font-semibold text-white">Open your studio<ArrowUpRight className="h-4 w-4" /></span></Link>;
}
