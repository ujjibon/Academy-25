'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  getAllSubmissionsForCourse,
  getInstructorCourseInsightsSummary,
  getInstructorCourseRoster,
} from '@/lib/classroom-service';
import type {
  ClassroomCourse,
  CourseSubmissionWithAssignment,
  InstructorCourseInsightsSummary,
  InstructorStudentRosterEntry,
} from '@/lib/classroom-types';
import { isProjectStyleAssignment } from '@/lib/instructor-course-access';
import { InstructorSubmissionReview } from '@/components/instructor/InstructorSubmissionReview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  ClipboardList,
  FileText,
  Megaphone,
  Users,
} from 'lucide-react';

interface InstructorCourseInsightsProps {
  course: ClassroomCourse;
}

export function InstructorCourseInsights({ course }: InstructorCourseInsightsProps) {
  const [summary, setSummary] = useState<InstructorCourseInsightsSummary | null>(null);
  const [roster, setRoster] = useState<InstructorStudentRosterEntry[]>([]);
  const [submissions, setSubmissions] = useState<CourseSubmissionWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, subs] = await Promise.all([
        getInstructorCourseInsightsSummary(course.id),
        getInstructorCourseRoster(course.id),
        getAllSubmissionsForCourse(course.id),
      ]);
      setSummary(s);
      setRoster(r);
      setSubmissions(subs);
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    load();
  }, [load]);

  const projectRows = submissions.filter(
    (row) =>
      isProjectStyleAssignment(row.assignment) ||
      row.submission.githubUrl ||
      row.submission.liveUrl
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="dashboard-kicker">Your course only</span>
          <h2 className="font-heading text-xl font-semibold mt-2">{course.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Class code {course.classCode} · Only students enrolled in your classroom appear below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/classroom/${course.id}/stream`}>
              <Megaphone className="mr-2 h-4 w-4" />
              Classroom
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/classroom/${course.id}/classwork`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Classwork
            </Link>
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Students" value={summary.studentCount} />
          <Stat label="Assignments" value={summary.assignmentCount} />
          <Stat label="Submissions" value={summary.submissionCount} />
          <Stat label="Pending grading" value={summary.pendingGrading} />
          <Stat label="Avg. progress" value={`${summary.averageProgress}%`} />
        </div>
      ) : null}

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Students ({roster.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Task submissions ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FileText className="h-4 w-4" />
            Projects & reports ({projectRows.length})
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          <StudentsTab roster={roster} />
        </TabsContent>

        <TabsContent value="submissions" className="mt-6 space-y-3">
          {submissions.length === 0 ? (
            <EmptyState message="No submissions yet for your assignments." />
          ) : (
            submissions.map((row) => (
              <InstructorSubmissionReview
                key={row.submission.id}
                row={row}
                onGraded={load}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="projects" className="mt-6 space-y-3">
          {course.bootcamp?.projects && course.bootcamp.projects.length > 0 ? (
            <Card className="brand-card">
              <CardHeader>
                <CardTitle className="text-base">Expected bootcamp projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.bootcamp.projects.map((p) => (
                  <div key={p.id} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-muted-foreground text-xs">{p.description}</p>
                    <ul className="text-xs mt-1 list-disc pl-4 text-muted-foreground">
                      {p.reportRequirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {projectRows.length === 0 ? (
            <EmptyState message="No project or report submissions yet." />
          ) : (
            projectRows.map((row) => (
              <InstructorSubmissionReview
                key={`proj-${row.submission.id}`}
                row={row}
                onGraded={load}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressTab roster={roster} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentsTab({ roster }: { roster: InstructorStudentRosterEntry[] }) {
  if (roster.length === 0) {
    return <EmptyState message="No students enrolled yet. Share your class code to invite learners." />;
  }

  return (
    <Card className="brand-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Submissions</th>
              <th className="px-4 py-3 font-medium">Graded</th>
              <th className="px-4 py-3 font-medium">Projects</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((student) => (
              <tr key={student.studentId} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.photoURL} alt={student.displayName} />
                      <AvatarFallback>{student.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.displayName}</p>
                      {student.email ? (
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[8rem]">
                    <Progress value={student.progressPercent} className="h-2 flex-1" />
                    <span className="text-xs font-medium w-10">{student.progressPercent}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {student.assignmentsSubmitted} / {student.assignmentsTotal}
                </td>
                <td className="px-4 py-3">{student.assignmentsGraded}</td>
                <td className="px-4 py-3">{student.projectSubmissions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ProgressTab({ roster }: { roster: InstructorStudentRosterEntry[] }) {
  if (roster.length === 0) {
    return <EmptyState message="Progress tracking appears once students enroll." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {roster.map((student) => (
        <Card key={student.studentId} className="brand-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={student.photoURL} />
                <AvatarFallback>{student.displayName[0]}</AvatarFallback>
              </Avatar>
              {student.displayName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Course completion</span>
                <span className="font-semibold">{student.progressPercent}%</span>
              </div>
              <Progress value={student.progressPercent} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="font-bold text-lg">{student.assignmentsSubmitted}</p>
                <p className="text-muted-foreground">Submitted</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="font-bold text-lg">{student.assignmentsGraded}</p>
                <p className="text-muted-foreground">Graded</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="font-bold text-lg">{student.projectSubmissions}</p>
                <p className="text-muted-foreground">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="brand-card">
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="brand-card p-8 text-center text-muted-foreground">
      <p>{message}</p>
    </Card>
  );
}
