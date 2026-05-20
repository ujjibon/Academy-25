'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BootcampPlan } from '@/lib/bootcamp-types';
import {
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  Layers,
  Loader2,
  Users,
} from 'lucide-react';

type BootcampPlanPreviewProps = {
  plan: BootcampPlan;
  isPublishing: boolean;
  canPublish: boolean;
  onPublish: () => void;
  publishedClassCode?: string | null;
  publishedCourseId?: string | null;
};

export function BootcampPlanPreview({
  plan,
  isPublishing,
  canPublish,
  onPublish,
  publishedClassCode,
  publishedCourseId,
}: BootcampPlanPreviewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{plan.title}</CardTitle>
          <CardDescription>{plan.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Sections ({plan.sections.length})
            </p>
            <div className="mt-2 space-y-2">
              {plan.sections.map((section) => (
                <div key={section.id} className="rounded-lg border p-3">
                  <p className="font-medium text-sm">{section.title}</p>
                  {section.description ? (
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Timeline
            </p>
            {plan.timeline.map((item, index) => (
              <div key={`${item.week}-${index}`} className="rounded-lg border p-3 mt-2">
                <p className="font-medium text-sm">{item.week}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.objective}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.deliverables.map((deliverable, deliverableIndex) => (
                    <Badge key={`${deliverable}-${deliverableIndex}`} variant="secondary">
                      {deliverable}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Materials & Projects</CardTitle>
          <CardDescription>Course materials and report submission projects.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {plan.materials.map((material) => (
              <div key={material.id} className="rounded-lg border p-3">
                <p className="font-medium text-sm">
                  {material.title}{' '}
                  <span className="text-muted-foreground">({material.type})</span>
                </p>
                <p className="text-sm text-muted-foreground">{material.purpose}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Project report submissions ({plan.projects.length})
            </p>
            {plan.projects.map((project) => (
              <div key={project.id} className="rounded-lg border p-3 mt-2">
                <p className="font-medium text-sm">{project.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                <ul className="list-disc pl-5 text-xs mt-2 space-y-1 text-muted-foreground">
                  {project.reportRequirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium">Task submission workflow</p>
            <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
              {plan.taskSubmissionFlow.workflow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mentorship & Dashboards
          </CardTitle>
          <CardDescription>
            One-to-one mentorship setup and role-based dashboard configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="font-medium text-sm">{plan.mentorship.title}</p>
            <p className="text-sm text-muted-foreground mt-2">{plan.mentorship.description}</p>
            <p className="text-xs text-muted-foreground mt-3">
              {plan.mentorship.sessionFrequency}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {plan.mentorship.mentorFocusAreas.map((area) => (
                <Badge key={area} variant="outline">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          {plan.dashboardConfig ? (
            <div className="grid gap-3 sm:grid-cols-3 md:col-span-1">
              {(['learner', 'instructor', 'admin'] as const).map((role) => (
                <div key={role} className="rounded-lg border p-3">
                  <p className="font-medium text-sm capitalize">{role}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {plan.dashboardConfig![role].widgets.map((widget) => (
                      <Badge key={widget} variant="secondary" className="text-[0.65rem]">
                        {widget}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5" />
            Execute Bootcamp Plan
          </CardTitle>
          <CardDescription>
            Creates classroom sections, course materials, timeline announcements, project submissions,
            and mentorship posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button onClick={onPublish} disabled={!canPublish || isPublishing}>
            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Execute & Publish Bootcamp
          </Button>
          {publishedClassCode ? (
            <>
              <Badge variant="outline">Class code: {publishedClassCode}</Badge>
              {publishedCourseId ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/classroom/${publishedCourseId}/stream`}>Open classroom</Link>
                </Button>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
