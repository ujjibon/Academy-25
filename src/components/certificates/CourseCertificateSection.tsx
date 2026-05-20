'use client';

import { useAuth } from '@/hooks/use-auth';
import { CertificateDownloadButton } from '@/components/certificates/CertificateDownloadButton';
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
        <CardHeader>
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
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Course completed — get your certificate
        </CardTitle>
        <CardDescription>
          Download your official Peer Academy certificate of completion.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <CertificateDownloadButton
          uid={user?.uid}
          payload={{
            type: 'course',
            title: courseTitle,
            skillOrCourseId: courseId,
            recipientName: userProfile.displayName,
            completionSummary: `Successfully completed all lessons and assessments in ${courseTitle}.`,
          }}
        />
        <Button variant="outline" asChild>
          <Link href="/training/certificates">All certificates</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
