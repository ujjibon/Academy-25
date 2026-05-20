'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { InstructorCoursePicker } from '@/components/platform/InstructorCoursePicker';
export { InstructorCommercePanel } from '@/components/platform/InstructorCommercePanel';
import { CreateAssignmentDialog } from '@/components/classroom/CreateAssignmentDialog';
import { InstructorSubmissionReview } from '@/components/instructor/InstructorSubmissionReview';
import { InstructorTeachingTools } from '@/components/instructor/InstructorTeachingTools';
import { TeachModeContent } from '@/components/teach/TeachModeContent';
import { CourseCreatorContent } from '@/components/instructor/CourseCreatorContent';
import { BootcampStudioContent } from '@/components/instructor/BootcampStudioContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ClassroomCourse, CourseBundle, DripModuleRelease } from '@/lib/classroom-types';
import {
  getInstructorAssignments,
  getInstructorAnalyticsSummary,
  getInstructorBundles,
  getInstructorCourses,
  getAllSubmissionsForCourse,
  getCourseContent,
  getModulesForClassroomCourse,
  saveCourseBundle,
  deleteCourseBundle,
  updateClassroomCourseSettings,
} from '@/lib/classroom-service';
import type { CourseModule } from '@/lib/classroom-types';
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  Megaphone,
  PenSquare,
  Sparkles,
  Trash2,
  Workflow,
} from 'lucide-react';
import { CertificateDownloadPanel } from '@/components/certificates/CertificateDownloadPanel';

function useInstructorCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCourses(await getInstructorCourses(user.uid));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { courses, loading, reload: load, userId: user?.uid };
}

export function InstructorAssignmentsPanel() {
  const { courses, loading, userId, reload } = useInstructorCourses();
  const [assignments, setAssignments] = useState<
    Awaited<ReturnType<typeof getInstructorAssignments>>
  >([]);
  const [courseId, setCourseId] = useState('');

  const loadAssignments = useCallback(() => {
    if (!userId) return;
    getInstructorAssignments(userId).then(setAssignments);
  }, [userId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (courses.length && !courseId) setCourseId(courses[0].id);
  }, [courses, courseId]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      {courses.length > 0 ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Create for course</Label>
            <InstructorCoursePicker
              courses={courses}
              value={courseId}
              onChange={setCourseId}
            />
          </div>
          {courseId ? (
            <CreateAssignmentDialog
              courseId={courseId}
              onCreated={loadAssignments}
              triggerLabel="New assignment"
            />
          ) : null}
        </div>
      ) : (
        <Card className="brand-card p-6 text-center text-muted-foreground">
          Create a course in Course Builder first.
        </Card>
      )}

      {assignments.length === 0 ? (
        <Card className="brand-card p-6 text-center text-muted-foreground">
          No assignments yet. Use New assignment above.
        </Card>
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => (
            <li key={a.id}>
              <Card className="brand-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.courseTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due {format(a.deadline, 'MMM d, yyyy')} · {a.points} pts
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/classroom/${a.courseId}/assignments/${a.id}`}>
                        Open
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/instructor/gradebook?course=${a.courseId}`}>
                        Grade
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function InstructorContentDripPanel() {
  const { courses, loading, reload, userId } = useInstructorCourses();
  const { toast } = useToast();
  const [courseId, setCourseId] = useState('');
  const [schedule, setSchedule] = useState<DripModuleRelease[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    if (courses.length && !courseId) setCourseId(courses[0].id);
  }, [courses, courseId]);

  useEffect(() => {
    if (course) setSchedule(course.dripSchedule ?? []);
  }, [course]);

  useEffect(() => {
    if (!course) {
      setModules([]);
      return;
    }
    setModulesLoading(true);
    getModulesForClassroomCourse(course)
      .then(setModules)
      .finally(() => setModulesLoading(false));
  }, [course]);

  async function save() {
    if (!userId || !courseId) return;
    setSaving(true);
    try {
      await updateClassroomCourseSettings(courseId, userId, {
        dripSchedule: schedule,
        modules: modules.length > 0 ? modules : undefined,
      });
      toast({ title: 'Drip schedule saved' });
      reload();
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      <InstructorCoursePicker courses={courses} value={courseId} onChange={setCourseId} />
      {modulesLoading ? (
        <Skeleton className="h-32 w-full max-w-xl" />
      ) : modules.length > 0 ? (
        <div className="space-y-4 max-w-xl">
          {modules.map((mod) => {
            const entry = schedule.find((s) => s.moduleId === mod.id);
            return (
              <div key={mod.id} className="flex flex-col gap-2 rounded-lg border p-4">
                <Label>{mod.title}</Label>
                <Input
                  type="datetime-local"
                  value={entry?.releaseAt?.slice(0, 16) ?? ''}
                  onChange={(e) => {
                    const iso = e.target.value ? new Date(e.target.value).toISOString() : '';
                    setSchedule((prev) => {
                      const rest = prev.filter((s) => s.moduleId !== mod.id);
                      return iso ? [...rest, { moduleId: mod.id, releaseAt: iso }] : rest;
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to release immediately
                </p>
              </div>
            );
          })}
          <Button onClick={save} disabled={saving} className="brand-button">
            {saving ? 'Saving…' : 'Save drip schedule'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add modules in Course Builder before scheduling releases.
        </p>
      )}
    </div>
  );
}

export function InstructorLessonsPanel() {
  const { courses, loading } = useInstructorCourses();
  const [courseId, setCourseId] = useState('');
  const [content, setContent] = useState<Awaited<ReturnType<typeof getCourseContent>>>(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    if (courses.length && !courseId) setCourseId(courses[0].id);
  }, [courses, courseId]);

  useEffect(() => {
    if (!courseId) return;
    const course = courses.find((c) => c.id === courseId);
    const contentId = course?.contentCourseId || courseId;
    setContentLoading(true);
    getCourseContent(contentId)
      .then(setContent)
      .finally(() => setContentLoading(false));
  }, [courseId, courses]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  const course = courses.find((c) => c.id === courseId);
  const contentId = course?.contentCourseId || courseId;

  return (
    <div className="space-y-6">
      <InstructorCoursePicker courses={courses} value={courseId} onChange={setCourseId} />
      {course ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="brand-button">
              <Link href={`/instructor/course-builder?edit=${course.id}`}>
                Edit in Course Builder
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/classroom/${course.id}/lessons`}>Classroom curriculum</Link>
            </Button>
            {contentId ? (
              <Button variant="outline" asChild>
                <Link href={`/courses/${contentId}`}>Learner preview</Link>
              </Button>
            ) : null}
          </div>
          {contentLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : content?.lessons.length ? (
            <ul className="space-y-2 rounded-lg border divide-y">
              {content.lessons.map((lesson, i) => (
                <li
                  key={lesson.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {String(i + 1).padStart(2, '0')}. {lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lesson.duration} min
                      {lesson.practice ? ' · Practice quiz' : ''}
                      {lesson.assessment ? ' · Assessment' : ''}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/courses/${contentId}/${lesson.id}`}>Preview</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No lessons yet. Add them in Course Builder.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

export function InstructorLiveClassesPanel() {
  const { courses, loading } = useInstructorCourses();
  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.length === 0 ? (
        <Card className="brand-card p-6 text-muted-foreground sm:col-span-2">
          Create a course to launch a live classroom.
        </Card>
      ) : (
        courses.map((c) => (
          <Card key={c.id} className="brand-card">
            <CardHeader>
              <CardTitle className="text-lg">{c.title}</CardTitle>
              <CardDescription>Code: {c.classCode}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" asChild className="brand-button">
                <Link href={`/classroom/${c.id}/stream`}>
                  <Megaphone className="mr-2 h-3.5 w-3.5" />
                  Stream
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/classroom/${c.id}/people`}>People</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/classroom/${c.id}/classwork`}>Classwork</Link>
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export function InstructorAiStudioPanel() {
  const { courses, loading, reload } = useInstructorCourses();
  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <Tabs defaultValue="teach" className="w-full">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
        <TabsTrigger value="teach" className="gap-2">
          <PenSquare className="h-4 w-4" />
          Teach mode
        </TabsTrigger>
        <TabsTrigger value="creator" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI lessons
        </TabsTrigger>
        <TabsTrigger value="bootcamp" className="gap-2">
          <Workflow className="h-4 w-4" />
          Bootcamp
        </TabsTrigger>
      </TabsList>
      <TabsContent value="teach" className="mt-6">
        <TeachModeContent embedded onCoursePublished={reload} />
      </TabsContent>
      <TabsContent value="creator" className="mt-6">
        <CourseCreatorContent showHeader={false} />
      </TabsContent>
      <TabsContent value="bootcamp" className="mt-6">
        <BootcampStudioContent showHeader={false} onPublished={reload} />
      </TabsContent>
    </Tabs>
  );
}

export function InstructorBundlesPanel() {
  const { courses, loading, reload, userId } = useInstructorCourses();
  const { toast } = useToast();
  const [bundles, setBundles] = useState<CourseBundle[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [price, setPrice] = useState('0');

  const loadBundles = useCallback(async () => {
    if (!userId) return;
    setBundles(await getInstructorBundles(userId));
  }, [userId]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  async function createBundle() {
    if (!userId || !title.trim() || selectedIds.length === 0) {
      toast({ title: 'Add a title and select at least one course', variant: 'destructive' });
      return;
    }
    try {
      await saveCourseBundle(userId, {
        title: title.trim(),
        description: description.trim(),
        courseIds: selectedIds,
        instructorId: userId,
        priceCents: Math.round(parseFloat(price || '0') * 100),
      });
      toast({ title: 'Bundle created' });
      setTitle('');
      setDescription('');
      setSelectedIds([]);
      loadBundles();
      reload();
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    }
  }

  async function removeBundle(id: string) {
    if (!userId) return;
    await deleteCourseBundle(id, userId);
    toast({ title: 'Bundle removed' });
    loadBundles();
  }

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-8">
      <Card className="brand-card">
        <CardHeader>
          <CardTitle>New bundle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Price (USD)</Label>
            <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Courses in bundle</Label>
            {courses.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedIds.includes(c.id)}
                  onCheckedChange={(checked) => {
                    setSelectedIds((prev) =>
                      checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                    );
                  }}
                />
                {c.title}
              </label>
            ))}
          </div>
          <Button onClick={createBundle} className="brand-button">
            Create bundle
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-heading font-semibold">Your bundles</h3>
        {bundles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bundles yet.</p>
        ) : (
          bundles.map((b) => (
            <Card key={b.id} className="brand-card">
              <CardContent className="flex justify-between items-start pt-6">
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.courseIds.length} courses</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeBundle(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function InstructorGradebookPanel({
  initialCourseId = null,
}: {
  initialCourseId?: string | null;
}) {
  const { courses, loading } = useInstructorCourses();
  const [courseId, setCourseId] = useState(initialCourseId ?? '');
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getAllSubmissionsForCourse>>>([]);
  const [rowsLoading, setRowsLoading] = useState(false);

  const loadRows = useCallback(() => {
    if (!courseId) return;
    setRowsLoading(true);
    getAllSubmissionsForCourse(courseId)
      .then(setRows)
      .finally(() => setRowsLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (initialCourseId) setCourseId(initialCourseId);
    else if (courses.length && !courseId) setCourseId(courses[0].id);
  }, [courses, courseId, initialCourseId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  const pending = rows.filter(
    (r) => r.submission.status === 'submitted' || r.submission.status === 'late'
  );

  return (
    <div className="space-y-6">
      <InstructorCoursePicker courses={courses} value={courseId} onChange={setCourseId} />
      {rowsLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Assignment</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No submissions yet
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.submission.id} className="border-b">
                      <td className="px-4 py-3">{r.submission.studentName}</td>
                      <td className="px-4 py-3">{r.assignment.title}</td>
                      <td className="px-4 py-3 capitalize">{r.submission.status}</td>
                      <td className="px-4 py-3">
                        {r.submission.grade != null
                          ? `${r.submission.grade}/${r.assignment.points}`
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pending.length > 0 ? (
            <section className="space-y-3">
              <h3 className="font-heading font-semibold">
                Grade pending ({pending.length})
              </h3>
              {pending.map((row) => (
                <InstructorSubmissionReview
                  key={row.submission.id}
                  row={row}
                  onGraded={loadRows}
                />
              ))}
            </section>
          ) : null}
        </>
      )}
      {courseId ? (
        <Button variant="outline" asChild>
          <Link href={`/instructor/courses/${courseId}`}>Full course insights</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function InstructorAnalyticsPanel() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof getInstructorAnalyticsSummary>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getInstructorAnalyticsSummary(user.uid)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Courses', value: summary.courseCount },
          { label: 'Students', value: summary.totalStudents },
          { label: 'Assignments', value: summary.totalAssignments },
          { label: 'Pending grading', value: summary.pendingGrading },
        ].map((s) => (
          <Card key={s.label} className="brand-card">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {summary.courses.map((c) => (
          <Card key={c.id} className="brand-card">
            <CardContent className="flex justify-between items-center pt-6">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.enrolledStudentIds.filter((id) => id !== c.instructorId).length} students
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/instructor/courses/${c.id}`}>
                  <BarChart3 className="mr-2 h-3.5 w-3.5" />
                  Insights
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function InstructorCertificatesPanel() {
  const { user } = useAuth();
  const { courses, loading } = useInstructorCourses();

  return (
    <div className="space-y-6 max-w-4xl">
      <p className="text-sm text-muted-foreground">
        Learners earn PDF certificates when they complete skill training or reach 100% course
        progress. Customize the Peer Portal certificate design below — learners use the same
        template when downloading.
      </p>
      <Card className="brand-card">
        <CardHeader>
          <CardTitle>Certificate templates</CardTitle>
          <CardDescription>
            18 professional layouts with Peer Portal logo. Preview any template or download a
            sample PDF, then set your preferred default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CertificateDownloadPanel
            showSaveDefaults
            base={{ type: 'course', skillOrCourseId: 'instructor-preview' }}
            recipientName="Sample Learner"
            programTitle="Sample Course Title"
            completionSummary="Preview how certificates will look for your learners."
            downloadLabel="Download sample PDF"
          />
        </CardContent>
      </Card>
      <Card className="brand-card">
        <CardHeader>
          <CardTitle>Training programs</CardTitle>
          <CardDescription>
            Build skill tracks with AI — learners download certificates after completion.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild className="brand-button">
            <Link href="/training">Create & manage programs</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/learn/certificates">
              <ExternalLink className="mr-2 h-4 w-4" />
              Learner certificate view
            </Link>
          </Button>
        </CardContent>
      </Card>
      {!loading && courses.length > 0 ? (
        <Card className="brand-card">
          <CardHeader>
            <CardTitle>Your classroom courses</CardTitle>
            <CardDescription>
              Learners at 100% progress on catalog courses can claim certificates on the
              certificates page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {courses.map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>{c.title}</span>
                  <Link
                    href={`/classroom/${c.id}/grades`}
                    className="text-primary hover:underline shrink-0"
                  >
                    Progress
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
      {user ? (
        <p className="text-xs text-muted-foreground">
          Signed in as {user.email}. Certificate PDFs use /api/certificates/generate.
        </p>
      ) : null}
    </div>
  );
}

export function InstructorPrerequisitesPanel() {
  const { courses, loading, reload, userId } = useInstructorCourses();
  const { toast } = useToast();
  const [courseId, setCourseId] = useState('');
  const [prereqIds, setPrereqIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  const otherCourses = courses.filter((c) => c.id !== courseId);

  useEffect(() => {
    if (courses.length && !courseId) setCourseId(courses[0].id);
  }, [courses, courseId]);

  useEffect(() => {
    if (course) setPrereqIds(course.prerequisiteCourseIds ?? []);
  }, [course]);

  async function save() {
    if (!userId || !courseId) return;
    setSaving(true);
    try {
      await updateClassroomCourseSettings(courseId, userId, {
        prerequisiteCourseIds: prereqIds,
      });
      toast({ title: 'Prerequisites saved' });
      reload();
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6 max-w-lg">
      <InstructorCoursePicker courses={courses} value={courseId} onChange={setCourseId} />
      <div className="space-y-2">
        <Label>Required courses before enrollment</Label>
        {otherCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Create more courses to set prerequisites.</p>
        ) : (
          otherCourses.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={prereqIds.includes(c.id)}
                onCheckedChange={(checked) => {
                  setPrereqIds((prev) =>
                    checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                  );
                }}
              />
              {c.title}
            </label>
          ))
        )}
      </div>
      <Button onClick={save} disabled={saving} className="brand-button">
        {saving ? 'Saving…' : 'Save prerequisites'}
      </Button>
    </div>
  );
}

export function InstructorCourseBuilderPanel({
  initialEditCourseId = null,
}: {
  initialEditCourseId?: string | null;
}) {
  const { courses, loading, reload } = useInstructorCourses();
  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <InstructorTeachingTools
      courses={courses}
      onCoursesChange={reload}
      initialEditCourseId={initialEditCourseId}
    />
  );
}
