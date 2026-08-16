import { courses as catalog, type CourseInfo } from '@/lib/courses';
import { getCourse, type Course, type Lesson } from '@/lib/data-provider';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels';

export type CourseMaterial = {
  id: string;
  title: string;
  type: 'lesson-guide' | 'worksheet' | 'checklist' | 'project-brief' | 'slide-deck' | 'handout';
  description: string;
  lessonId?: string;
  durationLabel?: string;
};

export type CourseResource = {
  id: string;
  title: string;
  description: string;
  category: 'docs' | 'tool' | 'article' | 'community' | 'reference';
  href: string;
  external?: boolean;
};

export type CourseDetails = {
  courseId: string;
  rating: number;
  reviewCount: number;
  enrolledCount: number;
  participantsActive: number;
  instructorName: string;
  instructorTitle: string;
  level: CourseLevel;
  language: string;
  tags: string[];
  learningOutcomes: string[];
  materials: CourseMaterial[];
  resources: CourseResource[];
};

type CourseDetailsOverride = Partial<
  Omit<CourseDetails, 'courseId' | 'materials' | 'resources'>
> & {
  materials?: CourseMaterial[];
  resources?: CourseResource[];
};

/** Stable hash so demo stats stay consistent across renders. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

function defaultStats(courseId: string, lessonCount: number) {
  const h = hashId(courseId);
  const rating = Math.round((4.2 + (h % 80) / 100) * 10) / 10; // 4.2–4.9
  const reviewCount = 48 + (h % 420);
  const enrolledCount = 180 + (h % 2400) + lessonCount * 17;
  const participantsActive = Math.max(
    12,
    Math.round(enrolledCount * (0.08 + (h % 12) / 100))
  );
  return { rating: Math.min(5, rating), reviewCount, enrolledCount, participantsActive };
}

function materialTypeForIndex(i: number): CourseMaterial['type'] {
  const types: CourseMaterial['type'][] = [
    'lesson-guide',
    'worksheet',
    'project-brief',
    'checklist',
    'handout',
    'slide-deck',
  ];
  return types[i % types.length];
}

function materialsFromLessons(course: Course): CourseMaterial[] {
  return course.lessons.map((lesson: Lesson, index: number) => ({
    id: `${course.id}-mat-${lesson.id}`,
    title: `${lesson.title} — study pack`,
    type: materialTypeForIndex(index),
    description:
      lesson.project?.description?.slice(0, 140) ||
      `Guided materials for “${lesson.title}”: notes, practice cues, and project brief.`,
    lessonId: lesson.id,
    durationLabel: `${lesson.duration} min lesson`,
  }));
}

const SHARED_RESOURCES: CourseResource[] = [
  {
    id: 'peer-help',
    title: 'Peer Academy Help Center',
    description: 'Guides for joining classrooms, tracking progress, and earning certificates.',
    category: 'docs',
    href: '/learn',
  },
  {
    id: 'certificates',
    title: 'Certificates & completion',
    description: 'How course completion unlocks shareable certificates.',
    category: 'docs',
    href: '/learn/certificates',
  },
];

const CATEGORY_RESOURCES: Record<string, CourseResource[]> = {
  programming: [
    {
      id: 'mdn',
      title: 'MDN Web Docs',
      description: 'Authoritative reference for HTML, CSS, and JavaScript APIs.',
      category: 'reference',
      href: 'https://developer.mozilla.org/',
      external: true,
    },
    {
      id: 'python-docs',
      title: 'Python documentation',
      description: 'Official language reference and standard library docs.',
      category: 'reference',
      href: 'https://docs.python.org/3/',
      external: true,
    },
  ],
  design: [
    {
      id: 'figma-community',
      title: 'Figma Community',
      description: 'UI kits, files, and plugins to accelerate design practice.',
      category: 'community',
      href: 'https://www.figma.com/community',
      external: true,
    },
  ],
  ai: [
    {
      id: 'prompt-library',
      title: 'Prompt pattern library',
      description: 'Reusable prompt structures for research, coding, and creative work.',
      category: 'article',
      href: '/courses/masters-prompt-engineering',
    },
  ],
  productivity: [
    {
      id: 'workspace',
      title: 'Google Workspace Learning Center',
      description: 'Official tips for Docs, Sheets, Drive, and collaboration.',
      category: 'tool',
      href: 'https://workspace.google.com/learning/',
      external: true,
    },
  ],
};

const COURSE_OVERRIDES: Record<string, CourseDetailsOverride> = {
  'masters-codex': {
    instructorName: 'Maya Chen',
    instructorTitle: 'AI Engineering Lead',
    level: 'Intermediate',
    tags: ['Codex', 'Pair programming', 'Refactoring'],
    learningOutcomes: [
      'Write production-ready prompts for feature work and refactors',
      'Debug with AI pair programming without losing ownership',
      'Ship tested changes with architecture sketches and review discipline',
    ],
  },
  'masters-antigravity': {
    instructorName: 'Jordan Blake',
    instructorTitle: 'Agent Systems Instructor',
    level: 'Advanced',
    tags: ['Agents', 'Workflows', 'Team AI'],
    learningOutcomes: [
      'Brief agents with clear goals, constraints, and success checks',
      'Run multi-step missions with workspace context and reviews',
      'Build team-ready session systems for AI-assisted development',
    ],
  },
  'masters-claude': {
    instructorName: 'Priya Nair',
    instructorTitle: 'Knowledge Systems Coach',
    level: 'Intermediate',
    tags: ['Claude', 'Research', 'Writing'],
    learningOutcomes: [
      'Use long-context reasoning for research and analysis',
      'Design structured prompts that produce reliable drafts',
      'Turn synthesis into shippable knowledge work',
    ],
  },
  'masters-perplexity': {
    instructorName: 'Sam Okonkwo',
    instructorTitle: 'Research Methods Mentor',
    level: 'Beginner',
    tags: ['Research', 'Citations', 'Verification'],
    learningOutcomes: [
      'Run cited research loops with source triage',
      'Verify claims before using them in decisions',
      'Produce trustworthy briefs from web answers',
    ],
  },
  'masters-figma': {
    instructorName: 'Elena Voss',
    instructorTitle: 'Product Design Lead',
    level: 'Intermediate',
    tags: ['Figma', 'UI systems', 'Prototyping'],
    learningOutcomes: [
      'Build layout systems with components and variants',
      'Prototype flows that communicate intent clearly',
      'Hand off developer-ready specs from Figma',
    ],
  },
  'masters-canva': {
    instructorName: 'Chris Adeyemi',
    instructorTitle: 'Brand Design Instructor',
    level: 'Beginner',
    tags: ['Canva', 'Brand kits', 'Marketing'],
    learningOutcomes: [
      'Set up brand kits and reusable layout systems',
      'Ship social, presentation, and campaign assets',
      'Keep marketing visuals consistent without design chaos',
    ],
  },
  'masters-higgsfield': {
    instructorName: 'Nora Park',
    instructorTitle: 'Motion & AI Video Coach',
    level: 'Intermediate',
    tags: ['AI video', 'Motion', 'Short-form'],
    learningOutcomes: [
      'Write motion briefs and style-locked prompts',
      'Iterate AI video with export discipline',
      'Ship short-form motion pieces end to end',
    ],
  },
  'masters-capcut': {
    instructorName: 'Leo Martins',
    instructorTitle: 'Short-Form Editor',
    level: 'Beginner',
    tags: ['CapCut', 'Editing', 'Captions'],
    learningOutcomes: [
      'Cut and pace timelines that hold attention',
      'Add captions, sound, and effects with restraint',
      'Export social-ready short-form video',
    ],
  },
  'masters-prompt-engineering': {
    instructorName: 'Aisha Rahman',
    instructorTitle: 'Prompt Systems Architect',
    level: 'All levels',
    tags: ['Prompts', 'Evaluation', 'Standards'],
    learningOutcomes: [
      'Apply transferable prompt patterns across tools',
      'Evaluate outputs and diagnose prompt failures',
      'Build team prompt libraries and standards',
    ],
  },
  'masters-creative-ai-capstone': {
    instructorName: 'Peer Academy Faculty',
    instructorTitle: 'Capstone Mentors',
    level: 'Advanced',
    tags: ['Capstone', 'Campaign', 'Multi-tool'],
    learningOutcomes: [
      'Integrate research, design, and video tools into one campaign',
      'Move from brief to multi-asset launch',
      'Present a cohesive Creative AI portfolio piece',
    ],
  },
  'react-fundamentals': {
    instructorName: 'Alex Rivera',
    instructorTitle: 'Frontend Engineer',
    level: 'Beginner',
    tags: ['React', 'JSX', 'Components'],
    learningOutcomes: [
      'Build UI with JSX, components, and props',
      'Handle state and interactive patterns',
      'Ship small React apps with confidence',
    ],
  },
  'advanced-css': {
    instructorName: 'Sofia Berg',
    instructorTitle: 'CSS & Layout Specialist',
    level: 'Intermediate',
    tags: ['CSS', 'Flexbox', 'Grid'],
    learningOutcomes: [
      'Lay out pages with Flexbox and Grid',
      'Use modern CSS patterns for responsive UI',
      'Organize styles with Sass-friendly workflows',
    ],
  },
  'digital-productivity-mastery': {
    instructorName: 'Taylor Kim',
    instructorTitle: 'Workplace Productivity Coach',
    level: 'Beginner',
    tags: ['Workspace', 'Office', 'Notion'],
    learningOutcomes: [
      'Master core Google Workspace and Office workflows',
      'Organize work in Notion and visual tools like Canva',
      'Build a personal productivity system that sticks',
    ],
  },
  'Python-SP-101': {
    instructorName: 'Dev Patel',
    instructorTitle: 'Python Instructor',
    level: 'Beginner',
    tags: ['Python', 'Basics', 'Projects'],
    learningOutcomes: [
      'Write clear Python with core syntax and data types',
      'Solve beginner problems with functions and control flow',
      'Complete small projects that build coding confidence',
    ],
  },
};

function resourceBucket(courseId: string, category?: string): CourseResource[] {
  if (courseId.startsWith('masters-') && courseId.includes('figma')) {
    return CATEGORY_RESOURCES.design;
  }
  if (
    courseId.includes('claude') ||
    courseId.includes('perplexity') ||
    courseId.includes('prompt') ||
    courseId.includes('codex') ||
    courseId.includes('antigravity') ||
    courseId.includes('higgsfield') ||
    courseId.includes('capstone')
  ) {
    return CATEGORY_RESOURCES.ai;
  }
  if (courseId.includes('canva') || courseId.includes('capcut')) {
    return CATEGORY_RESOURCES.design;
  }
  if (courseId.includes('productivity')) {
    return CATEGORY_RESOURCES.productivity;
  }
  if (category === 'programming') {
    return CATEGORY_RESOURCES.programming;
  }
  return CATEGORY_RESOURCES.ai;
}

function courseResources(info: CourseInfo, course: Course | undefined): CourseResource[] {
  const override = COURSE_OVERRIDES[info.id];
  if (override?.resources?.length) return override.resources;

  const lessonLinks: CourseResource[] = (course?.lessons ?? []).slice(0, 3).map((lesson) => ({
    id: `lesson-res-${lesson.id}`,
    title: `Lesson: ${lesson.title}`,
    description: `Open the interactive lesson (${lesson.duration} min).`,
    category: 'docs' as const,
    href: `/courses/${info.id}/${lesson.id}`,
  }));

  return [
    ...SHARED_RESOURCES,
    ...resourceBucket(info.id, info.category),
    ...lessonLinks,
    {
      id: 'curriculum',
      title: 'Full course overview',
      description: 'Curriculum, ratings, and enrollment details for this course.',
      category: 'docs',
      href: `/courses/${info.id}`,
    },
  ];
}

export function formatEnrollment(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  }
  return count.toLocaleString();
}

export function getCourseDetails(courseId: string): CourseDetails | null {
  const info = catalog.find((c) => c.id === courseId);
  if (!info) return null;

  const course = getCourse(courseId);
  const lessonCount = course?.lessons.length ?? 0;
  const stats = defaultStats(courseId, lessonCount);
  const override = COURSE_OVERRIDES[courseId] ?? {};

  const materials =
    override.materials ??
    (course
      ? materialsFromLessons(course)
      : [
          {
            id: `${courseId}-overview`,
            title: 'Course overview pack',
            type: 'handout' as const,
            description: 'Syllabus summary and getting-started checklist for this course.',
          },
        ]);

  return {
    courseId,
    rating: override.rating ?? stats.rating,
    reviewCount: override.reviewCount ?? stats.reviewCount,
    enrolledCount: override.enrolledCount ?? stats.enrolledCount,
    participantsActive: override.participantsActive ?? stats.participantsActive,
    instructorName: override.instructorName ?? 'Peer Academy',
    instructorTitle: override.instructorTitle ?? 'Faculty',
    level: override.level ?? (info.category === 'programming' ? 'Intermediate' : 'All levels'),
    language: override.language ?? 'English',
    tags: override.tags ?? [info.category === 'programming' ? 'Programming' : 'Skills'],
    learningOutcomes: override.learningOutcomes ?? [
      `Complete the ${info.title} curriculum end to end`,
      'Practice with interactive lessons, quizzes, and projects',
      'Build portfolio-ready artifacts from course projects',
    ],
    materials,
    resources: courseResources(info, course),
  };
}

export function getCourseCatalogMeta(courseId: string) {
  return getCourseDetails(courseId);
}

export function totalCourseMinutes(course: Course): number {
  return course.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
}

export function formatDurationHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

export const MATERIAL_TYPE_LABEL: Record<CourseMaterial['type'], string> = {
  'lesson-guide': 'Lesson guide',
  worksheet: 'Worksheet',
  checklist: 'Checklist',
  'project-brief': 'Project brief',
  'slide-deck': 'Slide deck',
  handout: 'Handout',
};

export const RESOURCE_CATEGORY_LABEL: Record<CourseResource['category'], string> = {
  docs: 'Documentation',
  tool: 'Tool',
  article: 'Article',
  community: 'Community',
  reference: 'Reference',
};
