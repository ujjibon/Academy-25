'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { BootcampMaterialType, BootcampPlan } from '@/lib/bootcamp-types';
import { Plus, Trash2 } from 'lucide-react';

type BootcampManualBuilderProps = {
  plan: BootcampPlan;
  onChange: (plan: BootcampPlan) => void;
  onPreview: () => void;
};

const materialTypes: BootcampMaterialType[] = [
  'lesson',
  'worksheet',
  'assignment',
  'quiz',
  'project',
  'reading',
];

export function BootcampManualBuilder({ plan, onChange, onPreview }: BootcampManualBuilderProps) {
  const updatePlan = (partial: Partial<BootcampPlan>) => onChange({ ...plan, ...partial });

  const addSection = () => {
    const nextOrder = plan.sections.length + 1;
    const id = `section-${Date.now()}`;
    updatePlan({
      sections: [
        ...plan.sections,
        { id, title: `Section ${nextOrder}`, description: '', order: nextOrder },
      ],
    });
  };

  const addTimelineWeek = () => {
    updatePlan({
      timeline: [
        ...plan.timeline,
        {
          week: `Week ${plan.timeline.length + 1}`,
          objective: '',
          deliverables: ['Deliverable'],
        },
      ],
    });
  };

  const addMaterial = () => {
    const sectionId = plan.sections[0]?.id;
    updatePlan({
      materials: [
        ...plan.materials,
        {
          id: `material-${Date.now()}`,
          title: 'New material',
          type: 'lesson',
          purpose: '',
          sectionId,
        },
      ],
    });
  };

  const addProject = () => {
    updatePlan({
      projects: [
        ...plan.projects,
        {
          id: `project-${Date.now()}`,
          title: 'New project report',
          description: '',
          reportRequirements: ['Written summary', 'Artifact link'],
          points: 100,
        },
      ],
    });
  };

  const addWorkflowStep = () => {
    updatePlan({
      taskSubmissionFlow: {
        ...plan.taskSubmissionFlow,
        workflow: [...plan.taskSubmissionFlow.workflow, 'New submission step'],
      },
    });
  };

  const addMentorFocus = () => {
    updatePlan({
      mentorship: {
        ...plan.mentorship,
        mentorFocusAreas: [...plan.mentorship.mentorFocusAreas, 'New focus area'],
      },
    });
  };

  const isValid =
    plan.title.trim().length > 2 &&
    plan.summary.trim().length > 10 &&
    plan.sections.length > 0 &&
    plan.timeline.length > 0 &&
    plan.materials.length > 0 &&
    plan.projects.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Basic bootcamp information.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bootcamp-title">Title</Label>
            <Input
              id="bootcamp-title"
              value={plan.title}
              onChange={(event) => updatePlan({ title: event.target.value })}
              placeholder="Full-Stack Engineering Bootcamp"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bootcamp-summary">Summary</Label>
            <Textarea
              id="bootcamp-summary"
              value={plan.summary}
              onChange={(event) => updatePlan({ summary: event.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bootcamp-description">Description</Label>
            <Textarea
              id="bootcamp-description"
              value={plan.description}
              onChange={(event) => updatePlan({ description: event.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Curriculum modules for the bootcamp.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add section
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.sections.map((section, index) => (
            <div key={section.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={section.title}
                  onChange={(event) => {
                    const sections = [...plan.sections];
                    sections[index] = { ...section, title: event.target.value };
                    updatePlan({ sections });
                  }}
                  placeholder="Section title"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    updatePlan({ sections: plan.sections.filter((item) => item.id !== section.id) })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={section.description || ''}
                onChange={(event) => {
                  const sections = [...plan.sections];
                  sections[index] = { ...section, description: event.target.value };
                  updatePlan({ sections });
                }}
                rows={2}
                placeholder="Section description"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Weekly objectives and deliverables.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addTimelineWeek}>
            <Plus className="mr-2 h-4 w-4" />
            Add week
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.timeline.map((week, index) => (
            <div key={`${week.week}-${index}`} className="rounded-lg border p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={week.week}
                  onChange={(event) => {
                    const timeline = [...plan.timeline];
                    timeline[index] = { ...week, week: event.target.value };
                    updatePlan({ timeline });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    updatePlan({ timeline: plan.timeline.filter((_, weekIndex) => weekIndex !== index) })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={week.objective}
                onChange={(event) => {
                  const timeline = [...plan.timeline];
                  timeline[index] = { ...week, objective: event.target.value };
                  updatePlan({ timeline });
                }}
                rows={2}
                placeholder="Weekly objective"
              />
              <Textarea
                value={week.deliverables.join('\n')}
                onChange={(event) => {
                  const timeline = [...plan.timeline];
                  timeline[index] = {
                    ...week,
                    deliverables: event.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  };
                  updatePlan({ timeline });
                }}
                rows={3}
                placeholder="One deliverable per line"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Materials</CardTitle>
            <CardDescription>Lessons, readings, worksheets, and quizzes.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
            <Plus className="mr-2 h-4 w-4" />
            Add material
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.materials.map((material, index) => (
            <div key={material.id} className="rounded-lg border p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  value={material.title}
                  onChange={(event) => {
                    const materials = [...plan.materials];
                    materials[index] = { ...material, title: event.target.value };
                    updatePlan({ materials });
                  }}
                  placeholder="Material title"
                />
                <Select
                  value={material.type}
                  onValueChange={(value: BootcampMaterialType) => {
                    const materials = [...plan.materials];
                    materials[index] = { ...material, type: value };
                    updatePlan({ materials });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={material.sectionId || plan.sections[0]?.id}
                  onValueChange={(value) => {
                    const materials = [...plan.materials];
                    materials[index] = { ...material, sectionId: value };
                    updatePlan({ materials });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={material.purpose}
                onChange={(event) => {
                  const materials = [...plan.materials];
                  materials[index] = { ...material, purpose: event.target.value };
                  updatePlan({ materials });
                }}
                rows={2}
                placeholder="Purpose / content summary"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updatePlan({ materials: plan.materials.filter((item) => item.id !== material.id) })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove material
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Projects & Report Submission</CardTitle>
            <CardDescription>Assignments created in classwork with report requirements.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addProject}>
            <Plus className="mr-2 h-4 w-4" />
            Add project
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.projects.map((project, index) => (
            <div key={project.id} className="rounded-lg border p-3 space-y-2">
              <Input
                value={project.title}
                onChange={(event) => {
                  const projects = [...plan.projects];
                  projects[index] = { ...project, title: event.target.value };
                  updatePlan({ projects });
                }}
                placeholder="Project title"
              />
              <Textarea
                value={project.description}
                onChange={(event) => {
                  const projects = [...plan.projects];
                  projects[index] = { ...project, description: event.target.value };
                  updatePlan({ projects });
                }}
                rows={2}
                placeholder="Project description"
              />
              <Textarea
                value={project.reportRequirements.join('\n')}
                onChange={(event) => {
                  const projects = [...plan.projects];
                  projects[index] = {
                    ...project,
                    reportRequirements: event.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  };
                  updatePlan({ projects });
                }}
                rows={3}
                placeholder="Report requirements (one per line)"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updatePlan({ projects: plan.projects.filter((item) => item.id !== project.id) })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove project
              </Button>
            </div>
          ))}

          <div className="space-y-2 pt-2">
            <Label>Submission workflow steps</Label>
            {plan.taskSubmissionFlow.workflow.map((step, index) => (
              <Input
                key={`${step}-${index}`}
                value={step}
                onChange={(event) => {
                  const workflow = [...plan.taskSubmissionFlow.workflow];
                  workflow[index] = event.target.value;
                  updatePlan({
                    taskSubmissionFlow: { ...plan.taskSubmissionFlow, workflow },
                  });
                }}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addWorkflowStep}>
              <Plus className="mr-2 h-4 w-4" />
              Add workflow step
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>One-to-One Mentorship</CardTitle>
          <CardDescription>Mentor section configuration for the bootcamp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Enable mentorship section</p>
              <p className="text-xs text-muted-foreground">
                Publishes mentorship details to the classroom stream.
              </p>
            </div>
            <Switch
              checked={plan.mentorship.enabled}
              onCheckedChange={(enabled) =>
                updatePlan({ mentorship: { ...plan.mentorship, enabled } })
              }
            />
          </div>
          <Input
            value={plan.mentorship.title}
            onChange={(event) =>
              updatePlan({
                mentorship: { ...plan.mentorship, title: event.target.value },
              })
            }
            placeholder="Mentorship title"
          />
          <Textarea
            value={plan.mentorship.description}
            onChange={(event) =>
              updatePlan({
                mentorship: { ...plan.mentorship, description: event.target.value },
              })
            }
            rows={2}
            placeholder="Mentorship description"
          />
          <Input
            value={plan.mentorship.sessionFrequency}
            onChange={(event) =>
              updatePlan({
                mentorship: { ...plan.mentorship, sessionFrequency: event.target.value },
              })
            }
            placeholder="Session frequency"
          />
          {plan.mentorship.mentorFocusAreas.map((area, index) => (
            <Input
              key={`${area}-${index}`}
              value={area}
              onChange={(event) => {
                const mentorFocusAreas = [...plan.mentorship.mentorFocusAreas];
                mentorFocusAreas[index] = event.target.value;
                updatePlan({
                  mentorship: { ...plan.mentorship, mentorFocusAreas },
                });
              }}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMentorFocus}>
            <Plus className="mr-2 h-4 w-4" />
            Add mentor focus area
          </Button>
          <Textarea
            value={plan.mentorship.bookingNotes}
            onChange={(event) =>
              updatePlan({
                mentorship: { ...plan.mentorship, bookingNotes: event.target.value },
              })
            }
            rows={2}
            placeholder="Booking notes for learners"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onPreview} disabled={!isValid}>
          Review plan & execute
        </Button>
      </div>
    </div>
  );
}
