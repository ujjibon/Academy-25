'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { courses } from '@/lib/courses';
import { getCourse } from '@/lib/data-provider';
import {
  getStoredCertificates,
  getStoredTrainings,
} from '@/lib/training-service';
import { CertificateDownloadButton } from '@/components/certificates/CertificateDownloadButton';
import type { CertificateRecord } from '@/lib/training-types';
import { Award, ArrowLeft, BookOpen, GraduationCap, Loader2 } from 'lucide-react';

type EligibleItem = {
  key: string;
  type: 'course' | 'training';
  title: string;
  skillOrCourseId: string;
  completionSummary?: string;
  progress?: number;
  status: 'eligible' | 'issued';
  issuedAt?: string;
};

export default function CertificatesPage() {
  const { user, userProfile, loading } = useAuth();
  const [storedCerts, setStoredCerts] = useState<CertificateRecord[]>([]);
  const [trainings, setTrainings] = useState<ReturnType<typeof getStoredTrainings>>([]);

  useEffect(() => {
    if (user?.uid) {
      setStoredCerts(getStoredCertificates(user.uid));
      setTrainings(getStoredTrainings(user.uid));
    }
  }, [user?.uid]);

  const eligible = useMemo(() => {
    if (!userProfile) return [] as EligibleItem[];

    const issuedIds = new Set(storedCerts.map((c) => c.id));
    const items: EligibleItem[] = [];

    for (const courseMeta of courses) {
      const progress = userProfile.courseProgress?.[courseMeta.id] ?? 0;
      const completed =
        progress >= 100 || userProfile.completedCourses?.includes(courseMeta.id);
      if (!completed) continue;

      const course = getCourse(courseMeta.id);
      const key = `course-${courseMeta.id}`;
      items.push({
        key,
        type: 'course',
        title: course?.title || courseMeta.title,
        skillOrCourseId: courseMeta.id,
        completionSummary: `Successfully completed all lessons and assessments in ${courseMeta.title}.`,
        progress,
        status: issuedIds.has(key) ? 'issued' : 'eligible',
        issuedAt: storedCerts.find((c) => c.id === key)?.issuedAt,
      });
    }

    for (const t of trainings) {
      if (t.status !== 'completed') continue;
      const key = `training-${t.id}`;
      items.push({
        key,
        type: 'training',
        title: t.title,
        skillOrCourseId: t.id,
        completionSummary: t.completionSummary,
        status: issuedIds.has(key) ? 'issued' : 'eligible',
        issuedAt: storedCerts.find((c) => c.id === key)?.issuedAt,
      });
    }

    return items;
  }, [userProfile, storedCerts, trainings]);

  const refreshCerts = () => {
    if (user?.uid) setStoredCerts(getStoredCertificates(user.uid));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const recipientName = userProfile?.displayName || 'Learner';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/training">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Training
          </Link>
        </Button>

        <div className="dashboard-hero">
          <span className="dashboard-kicker">Credentials</span>
          <h1 className="font-dashboard-title text-3xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            My Certificates
          </h1>
          <p className="text-muted-foreground mt-2">
            Download professional PDF certificates for completed courses and skill training
            programs.
          </p>
        </div>

        {eligible.length === 0 ? (
          <Card className="brand-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium text-foreground">No certificates available yet</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                Complete a course to 100% progress or finish a skills training program to unlock
                your certificate.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                <Button asChild variant="outline">
                  <Link href="/courses">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse courses
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/training">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Skills training
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {eligible.map((item) => (
              <Card key={item.key} className="brand-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {item.type === 'course' ? (
                          <BookOpen className="h-3.5 w-3.5" />
                        ) : (
                          <GraduationCap className="h-3.5 w-3.5" />
                        )}
                        {item.type === 'course' ? 'Course' : 'Skills training'}
                        {item.progress !== undefined && item.progress >= 100 && (
                          <span>· {item.progress}% complete</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={item.status === 'issued' ? 'secondary' : 'default'}>
                      {item.status === 'issued' ? 'Downloaded' : 'Ready'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CertificateDownloadButton
                    uid={user?.uid}
                    variant="outline"
                    payload={{
                      type: item.type,
                      title: item.title,
                      skillOrCourseId: item.skillOrCourseId,
                      recipientName,
                      completionSummary: item.completionSummary,
                      issuedAt: item.issuedAt,
                    }}
                    label="Download PDF certificate"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={refreshCerts}
                  >
                    Refresh list
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {storedCerts.length > 0 && (
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base">Download history</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              {storedCerts.map((c) => (
                <p key={c.id}>
                  {c.title} — {new Date(c.issuedAt).toLocaleDateString()}
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
