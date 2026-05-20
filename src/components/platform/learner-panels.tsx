'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import {
  getLearnerGradebook,
  getPublishedBundles,
  getUpcomingAssignmentsForUser,
  getUserEnrolledCourses,
  checkCoursePrerequisites,
  getModulesForClassroomCourse,
  isModuleReleased,
  getCoursesForSale,
  getLearnerAnalytics,
  joinBundleCourses,
} from '@/lib/classroom-service';
import type { ClassroomCourse, CourseModule } from '@/lib/classroom-types';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionManager } from '@/components/account/SubscriptionManager';
import { getStoredCertificates } from '@/lib/training-service';
import { CertificateDownloadButton } from '@/components/certificates/CertificateDownloadButton';
import { buildCertificateRequestForProgram } from '@/components/certificates/CertificateDownloadPanel';
import { CertificateCustomizer } from '@/components/certificates/CertificateCustomizer';
import { CertificateTemplatePicker } from '@/components/certificates/CertificateTemplatePicker';
import { useCertificateForm } from '@/hooks/use-certificate-form';
import { courses as catalogCourses } from '@/lib/courses';
import { useChatbot } from '@/hooks/use-chatbot';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  Megaphone,
  Package,
  School,
  CalendarClock,
  BookOpenCheck,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Award,
  PlayCircle,
  Loader2,
} from 'lucide-react';

export function LearnerAssignmentsPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof getUpcomingAssignmentsForUser>>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUpcomingAssignmentsForUser(user.uid, 20)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No upcoming assignments.{' '}
        <Link href="/classroom" className="text-primary hover:underline">
          Join a classroom
        </Link>{' '}
        to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <Link
            href={`/classroom/${a.courseId}/assignments/${a.id}`}
            className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <ClipboardList className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.courseTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Due {format(a.deadline, 'MMM d, yyyy')}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LearnerGradebookPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getLearnerGradebook>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getLearnerGradebook(user.uid)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No graded work yet. Complete assignments in your classrooms.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left">Course</th>
            <th className="px-4 py-3 text-left">Assignment</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.courseId}-${r.assignmentId}`} className="border-b">
              <td className="px-4 py-3">{r.courseTitle}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/classroom/${r.courseId}/assignments/${r.assignmentId}`}
                  className="hover:underline"
                >
                  {r.assignmentTitle}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize">{r.status}</td>
              <td className="px-4 py-3">
                {r.grade != null ? `${r.grade}/${r.points}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LearnerLiveClassesPanel() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserEnrolledCourses(user.uid)
      .then(setCourses)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (courses.length === 0) {
    return (
      <Card className="brand-card p-6 text-center">
        <School className="h-10 w-10 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">You are not enrolled in any live classrooms.</p>
        <Button asChild className="brand-button">
          <Link href="/classroom">Join with class code</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((c) => (
        <Card key={c.id} className="brand-card">
          <CardHeader>
            <CardTitle className="text-lg">{c.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" asChild className="brand-button">
              <Link href={`/classroom/${c.id}/stream`}>
                <Megaphone className="mr-2 h-3.5 w-3.5" />
                Stream
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/classroom/${c.id}/classwork`}>Classwork</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/classroom/${c.id}/grades`}>Grades</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LearnerBundlesPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Awaited<ReturnType<typeof getPublishedBundles>>>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getPublishedBundles()
      .then(setBundles)
      .catch((err) => console.error('Failed to load course bundles:', err))
      .finally(() => setLoading(false));
  }, [user]);

  async function enrollBundle(bundleId: string) {
    if (!user) return;
    setJoining(bundleId);
    try {
      const { joined } = await joinBundleCourses(bundleId, user.uid);
      toast({
        title: 'Enrolled in bundle',
        description: `Joined ${joined.length} course(s). Open Live Classes to start.`,
      });
    } catch (e) {
      toast({
        title: 'Could not enroll',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setJoining(null);
    }
  }

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (bundles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No course bundles published yet. Browse the{' '}
        <Link href="/marketplace" className="text-primary hover:underline">
          marketplace
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {bundles.map((b) => (
        <Card key={b.id} className="brand-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {b.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{b.description}</p>
            <p className="text-xs text-muted-foreground">
              {b.courseIds.length} courses
              {b.priceCents ? ` · $${(b.priceCents / 100).toFixed(2)}` : ' · Free'}
            </p>
            <Button
              size="sm"
              className="brand-button"
              disabled={joining === b.id}
              onClick={() => enrollBundle(b.id)}
            >
              {joining === b.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enroll in all courses
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LearnerPrerequisitesPanel() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<
    { course: ClassroomCourse; met: boolean; missing: ClassroomCourse[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const all = await getUserEnrolledCourses(user.uid);
      const results = await Promise.all(
        all.map(async (course) => {
          const { met, missing } = await checkCoursePrerequisites(user.uid, course);
          return { course, met, missing };
        })
      );
      setChecks(results);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  const withPrereqs = checks.filter((c) => (c.course.prerequisiteCourseIds?.length ?? 0) > 0);

  if (withPrereqs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        None of your enrolled courses require prerequisites. When joining new courses, required
        prior courses will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {withPrereqs.map(({ course, met, missing }) => (
        <li key={course.id}>
          <Card className="brand-card">
            <CardContent className="pt-6">
              <p className="font-medium">{course.title}</p>
              <p className={`text-sm mt-1 ${met ? 'text-green-600' : 'text-amber-600'}`}>
                {met ? 'All prerequisites met' : 'Missing prerequisites'}
              </p>
              {!met && missing.length > 0 ? (
                <ul className="mt-2 text-sm text-muted-foreground list-disc pl-5">
                  {missing.map((m) => (
                    <li key={m.id}>{m.title}</li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function LearnerContentDripPanel() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [courseId, setCourseId] = useState('');
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserEnrolledCourses(user.uid).then((list) => {
      setCourses(list);
      if (list.length) setCourseId(list[0].id);
      setLoading(false);
    });
  }, [user]);

  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    if (!course) return;
    getModulesForClassroomCourse(course).then(setModules);
  }, [course]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (courses.length === 0) {
    return (
      <Card className="brand-card p-6 text-center">
        <CalendarClock className="h-10 w-10 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Join a classroom to see scheduled releases.</p>
        <Button asChild className="brand-button">
          <Link href="/classroom">Join a class</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <select
        className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <ul className="space-y-3">
        {modules.map((mod) => {
          const released = course ? isModuleReleased(course, mod.id) : true;
          const entry = course?.dripSchedule?.find((s) => s.moduleId === mod.id);
          return (
            <li key={mod.id} className="rounded-lg border p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium">{mod.title}</p>
                  <p className={`text-sm mt-1 ${released ? 'text-green-600' : 'text-amber-600'}`}>
                    {released
                      ? 'Available now'
                      : entry
                        ? `Unlocks ${new Date(entry.releaseAt).toLocaleString()}`
                        : 'Scheduled'}
                  </p>
                </div>
                {released && course ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/classroom/${course.id}/lessons`}>Open</Link>
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LearnerLessonsPanel() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserEnrolledCourses(user.uid)
      .then(setCourses)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (courses.length === 0) {
    return (
      <Card className="brand-card p-6 text-center">
        <BookOpenCheck className="h-10 w-10 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Enroll in a course to access lessons.</p>
        <Button asChild className="brand-button">
          <Link href="/courses">Browse catalog</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((c) => (
        <Card key={c.id} className="brand-card">
          <CardHeader>
            <CardTitle className="text-lg">{c.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" asChild className="brand-button">
              <Link href={`/classroom/${c.id}/lessons`}>
                <PlayCircle className="mr-2 h-3.5 w-3.5" />
                Curriculum
              </Link>
            </Button>
            {c.contentCourseId ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/courses/${c.contentCourseId}`}>Catalog lessons</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LearnerAiStudioPanel() {
  const { open } = useChatbot();

  return (
    <Card className="brand-card max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI learning assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Get help with lessons, assignments, and study plans.
        </p>
        <Button className="brand-button" onClick={open}>
          Open AI Assistant
        </Button>
        <Button variant="outline" asChild>
          <Link href="/courses">Browse AI-powered lessons</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function LearnerCommercePanel() {
  const { toast } = useToast();
  const [forSale, setForSale] = useState<ClassroomCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCoursesForSale()
      .then(setForSale)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      {forSale.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No paid courses listed yet.{' '}
          <Link href="/marketplace" className="text-primary hover:underline">
            Browse marketplace
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {forSale.map((c) => (
            <Card key={c.id} className="brand-card">
              <CardHeader>
                <CardTitle className="text-lg">{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-2">
                  {c.priceCents ? `$${(c.priceCents / 100).toFixed(2)}` : 'Free'}
                </p>
                <p className="text-xs text-muted-foreground mb-3">Code: {c.classCode}</p>
                <Button
                  size="sm"
                  className="brand-button"
                  onClick={() => {
                    navigator.clipboard.writeText(c.classCode);
                    toast({ title: 'Class code copied' });
                  }}
                >
                  Copy code
                </Button>
                <Button size="sm" variant="outline" className="ml-2" asChild>
                  <Link href="/classroom">Join</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function LearnerAnalyticsPanel() {
  const { user, userProfile } = useAuth();
  const [analytics, setAnalytics] = useState<Awaited<
    ReturnType<typeof getLearnerAnalytics>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getLearnerAnalytics(user.uid, userProfile?.courseProgress ?? {})
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, [user, userProfile?.courseProgress]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Courses', value: analytics.coursesEnrolled },
          { label: 'Avg progress', value: `${analytics.avgProgress}%` },
          { label: 'Assignments', value: analytics.assignmentsTotal },
          { label: 'Avg score', value: `${analytics.averageScorePercent}%` },
        ].map((s) => (
          <Card key={s.label} className="brand-card">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {analytics.courseBreakdown.map((c) => (
        <div key={c.id}>
          <div className="flex justify-between text-sm mb-1">
            <span>{c.title}</span>
            <span>{c.progress}%</span>
          </div>
          <Progress value={c.progress} className="h-2" />
        </div>
      ))}
    </div>
  );
}

export function LearnerSubscriptionsPanel() {
  return (
    <div className="max-w-3xl">
      <SubscriptionManager />
    </div>
  );
}

export function LearnerCertificatesPanel() {
  const { user, userProfile } = useAuth();
  const [storedCerts, setStoredCerts] = useState(
    [] as ReturnType<typeof getStoredCertificates>
  );

  useEffect(() => {
    if (user?.uid) setStoredCerts(getStoredCertificates(user.uid));
  }, [user?.uid]);

  const recipientName = userProfile?.displayName || 'Learner';
  const firstProgram =
    storedCerts[0]?.title ||
    catalogCourses.find((meta) => {
      const progress = userProfile?.courseProgress?.[meta.id] ?? 0;
      return progress >= 100 || userProfile?.completedCourses?.includes(meta.id);
    })?.title ||
    'Your completed program';

  const completedCatalog = catalogCourses.filter((meta) => {
    const progress = userProfile?.courseProgress?.[meta.id] ?? 0;
    return progress >= 100 || userProfile?.completedCourses?.includes(meta.id);
  });

  const { form, setForm, ready, buildRequest, isValid } = useCertificateForm({
    recipientName,
    programTitle: firstProgram,
    completionSummary: `Successfully completed ${firstProgram}.`,
    type: 'course',
  });

  return (
    <div className="space-y-6">
      <Card className="brand-card">
        <CardContent className="pt-6 space-y-6">
          {ready && form ? (
            <>
              <CertificateCustomizer value={form} onChange={setForm} />
              <CertificateTemplatePicker compact />
              <p className="text-xs text-muted-foreground">
                Set your name and signatures once — then download any certificate below. Update
                program title in the customizer before each download if needed.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      {storedCerts.map((cert) => {
        const payload = buildRequest(
          { type: cert.type, skillOrCourseId: cert.skillOrCourseId },
          {
            programTitle: cert.title,
            completionSummary: cert.completionSummary ?? '',
            issuedAt: cert.issuedAt.slice(0, 10),
          }
        );
        return (
          <Card key={cert.id} className="brand-card">
            <CardContent className="flex flex-wrap justify-between items-center gap-3 pt-6">
              <div>
                <p className="font-medium">{cert.title}</p>
                <p className="text-xs text-muted-foreground">
                  Issued {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
              </div>
              {payload ? (
                <CertificateDownloadButton
                  uid={user?.uid}
                  payload={payload}
                  label="Download again"
                  variant="outline"
                  size="sm"
                  disabled={!isValid}
                />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
      {completedCatalog.map((meta) => {
        const payload = buildCertificateRequestForProgram(
          buildRequest,
          { type: 'course', skillOrCourseId: meta.id },
          meta.title,
          `Successfully completed ${meta.title}.`
        );
        return (
          <Card key={meta.id} className="brand-card">
            <CardContent className="flex flex-wrap justify-between items-center gap-3 pt-6">
              <div>
                <p className="font-medium">{meta.title}</p>
                <p className="text-sm text-muted-foreground">Course completed</p>
              </div>
              {payload ? (
                <CertificateDownloadButton
                  uid={user?.uid}
                  payload={payload}
                  size="sm"
                  disabled={!isValid}
                />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
      {storedCerts.length === 0 && completedCatalog.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/training" className="text-primary hover:underline">
            Start training
          </Link>{' '}
          or complete a course to earn certificates.
        </p>
      ) : null}
    </div>
  );
}
