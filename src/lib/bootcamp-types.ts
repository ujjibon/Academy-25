import type { Course } from '@/lib/data-provider';

export type BootcampMaterialType =
  | 'lesson'
  | 'worksheet'
  | 'assignment'
  | 'quiz'
  | 'project'
  | 'reading';

export type BootcampMaterial = {
  id: string;
  title: string;
  type: BootcampMaterialType;
  purpose: string;
  sectionId?: string;
};

export type BootcampSection = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export type BootcampTimelineWeek = {
  week: string;
  objective: string;
  deliverables: string[];
};

export type BootcampProject = {
  id: string;
  title: string;
  description: string;
  reportRequirements: string[];
  points: number;
  weekLabel?: string;
};

export type BootcampTaskSubmissionFlow = {
  workflow: string[];
  evaluationCriteria: string[];
  aiSupport: string[];
};

export type BootcampMentorship = {
  enabled: boolean;
  title: string;
  description: string;
  sessionFrequency: string;
  mentorFocusAreas: string[];
  bookingNotes: string;
};

export type BootcampDashboardRoleConfig = {
  title: string;
  widgets: string[];
  customizations: string[];
};

export type BootcampDashboardConfig = {
  learner: BootcampDashboardRoleConfig;
  instructor: BootcampDashboardRoleConfig;
  admin: BootcampDashboardRoleConfig;
};

export type BootcampMetadata = {
  summary: string;
  timeline: BootcampTimelineWeek[];
  materials: BootcampMaterial[];
  projects: BootcampProject[];
  taskSubmissionFlow: BootcampTaskSubmissionFlow;
  mentorship: BootcampMentorship;
  dashboardConfig?: BootcampDashboardConfig;
};

export type BootcampPlan = {
  title: string;
  summary: string;
  description: string;
  coverImage: string;
  sections: BootcampSection[];
  timeline: BootcampTimelineWeek[];
  materials: BootcampMaterial[];
  projects: BootcampProject[];
  taskSubmissionFlow: BootcampTaskSubmissionFlow;
  mentorship: BootcampMentorship;
  dashboardConfig?: BootcampDashboardConfig;
  course?: Course;
};

function slugId(text: string, prefix = 'item'): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `${prefix}-${Date.now()}`;
}

export function createEmptyBootcampPlan(): BootcampPlan {
  const sectionId = 'section-1';
  return {
    title: '',
    summary: '',
    description: '',
    coverImage: '/images/react-fundamentals.jpg',
    sections: [
      {
        id: sectionId,
        title: 'Foundation',
        description: 'Core concepts and setup',
        order: 1,
      },
    ],
    timeline: [
      {
        week: 'Week 1',
        objective: 'Kickoff and orientation',
        deliverables: ['Complete onboarding', 'Submit intro post'],
      },
    ],
    materials: [
      {
        id: 'material-1',
        title: 'Getting Started Guide',
        type: 'lesson',
        purpose: 'Introduce bootcamp goals and expectations',
        sectionId,
      },
    ],
    projects: [
      {
        id: 'project-1',
        title: 'Capstone Proposal',
        description: 'Submit your bootcamp capstone idea and scope.',
        reportRequirements: ['Problem statement', 'Target users', 'Success metrics'],
        points: 100,
        weekLabel: 'Week 1',
      },
    ],
    taskSubmissionFlow: {
      workflow: [
        'Learner submits project report in classwork',
        'AI provides first-pass feedback',
        'Instructor reviews and grades submission',
      ],
      evaluationCriteria: ['Completeness', 'Clarity', 'Technical quality'],
      aiSupport: ['Auto feedback on draft', 'Rubric suggestions'],
    },
    mentorship: {
      enabled: true,
      title: '1:1 Mentorship',
      description: 'Book weekly mentor sessions for personalized guidance.',
      sessionFrequency: 'Weekly 30-minute session',
      mentorFocusAreas: ['Career guidance', 'Project feedback', 'Interview prep'],
      bookingNotes: 'Mentor slots are posted every Monday in the stream.',
    },
    dashboardConfig: {
      learner: {
        title: 'Learner Bootcamp Dashboard',
        widgets: ['Timeline', 'Assignments', 'Mentorship'],
        customizations: ['Show/hide mentor card', 'Reorder widgets'],
      },
      instructor: {
        title: 'Instructor Bootcamp Dashboard',
        widgets: ['Cohort progress', 'Submissions queue', 'Mentor sessions'],
        customizations: ['Filter by section', 'Export reports'],
      },
      admin: {
        title: 'Admin Bootcamp Dashboard',
        widgets: ['Enrollment', 'Completion rate', 'Mentor utilization'],
        customizations: ['Role permissions', 'Branding'],
      },
    },
  };
}

export function normalizeAiBootcampOutput(output: {
  title: string;
  summary: string;
  description?: string;
  coverImage?: string;
  sections?: { id?: string; title: string; description?: string; order?: number }[];
  timeline: BootcampTimelineWeek[];
  materials: { title: string; type: BootcampMaterialType; purpose: string; sectionId?: string }[];
  projects?: {
    title: string;
    description: string;
    reportRequirements?: string[];
    points?: number;
    weekLabel?: string;
  }[];
  taskSubmissionFlow: BootcampTaskSubmissionFlow;
  mentorship?: Partial<BootcampMentorship>;
  dashboardConfig?: BootcampDashboardConfig;
  course: Course;
}): BootcampPlan {
  const sections: BootcampSection[] =
    output.sections?.length
      ? output.sections.map((section, index) => ({
          id: section.id || slugId(section.title, `section-${index + 1}`),
          title: section.title,
          description: section.description,
          order: section.order ?? index + 1,
        }))
      : output.timeline.map((week, index) => ({
          id: slugId(week.week, `section-${index + 1}`),
          title: week.week,
          description: week.objective,
          order: index + 1,
        }));

  const sectionIds = sections.map((section) => section.id);

  const materials: BootcampMaterial[] = output.materials.map((material, index) => ({
    id: slugId(material.title, `material-${index + 1}`),
    title: material.title,
    type: material.type,
    purpose: material.purpose,
    sectionId: material.sectionId || sectionIds[index % sectionIds.length],
  }));

  const projects: BootcampProject[] =
    output.projects?.length
      ? output.projects.map((project, index) => ({
          id: slugId(project.title, `project-${index + 1}`),
          title: project.title,
          description: project.description,
          reportRequirements: project.reportRequirements?.length
            ? project.reportRequirements
            : ['Written report', 'Demo link or repository'],
          points: project.points ?? 100,
          weekLabel: project.weekLabel,
        }))
      : output.timeline.flatMap((week) =>
          week.deliverables.map((deliverable, index) => ({
            id: slugId(`${week.week}-${deliverable}`, `project-${index + 1}`),
            title: deliverable,
            description: `Deliverable for ${week.week}: ${deliverable}`,
            reportRequirements: ['Submission summary', 'Evidence or artifact link'],
            points: 100,
            weekLabel: week.week,
          }))
        );

  return {
    title: output.title,
    summary: output.summary,
    description: output.description || output.summary,
    coverImage: output.coverImage || output.course.image || '/images/react-fundamentals.jpg',
    sections,
    timeline: output.timeline,
    materials,
    projects,
    taskSubmissionFlow: output.taskSubmissionFlow,
    mentorship: {
      enabled: output.mentorship?.enabled ?? true,
      title: output.mentorship?.title || '1:1 Mentorship',
      description:
        output.mentorship?.description ||
        'Personalized mentor sessions throughout the bootcamp.',
      sessionFrequency: output.mentorship?.sessionFrequency || 'Weekly 1:1 session',
      mentorFocusAreas: output.mentorship?.mentorFocusAreas?.length
        ? output.mentorship.mentorFocusAreas
        : ['Project feedback', 'Career guidance'],
      bookingNotes:
        output.mentorship?.bookingNotes ||
        'Book mentor sessions from the mentorship section in your dashboard.',
    },
    dashboardConfig: output.dashboardConfig,
    course: output.course,
  };
}
