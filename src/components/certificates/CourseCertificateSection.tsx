'use client';

import { useAuth } from '@/hooks/use-auth';
import { CertificateDownloadPanel } from '@/components/certificates/CertificateDownloadPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  courseId: string;
  courseTitle: string;
};

export function CourseCertificateSection({ courseId, courseTitle }: Props) {
  const { user, userProfile } = useAuth();

  if (!userProfile) return null;

  const progress = userProfile.courseProgress?.[courseId] ?? 0;
  const completed =
    progress >= 100 || userProfile.completedCourses?.includes(courseId);

  if (!completed) {
    return (
      <Card className="brand-card border-dashed">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Course certificate
          </CardTitle>
          <CardDescription>
            Complete all lessons to 100% progress to unlock your PDF certificate. Current
            progress: {progress}%
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="brand-card border-primary/20">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Course completed — get your certificate
        </CardTitle>
        <CardDescription>
          Customize your name, signatures, and design — then download your official Peer Portal
          PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <CertificateDownloadPanel
          compact
          uid={user?.uid}
          base={{ type: 'course', skillOrCourseId: courseId }}
          recipientName={userProfile.displayName || 'Learner'}
          programTitle={courseTitle}
          completionSummary={`Successfully completed all lessons and assessments in ${courseTitle}.`}
        />
        <Button variant="outline" asChild>
          <Link href="/training/certificates">All certificates</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
