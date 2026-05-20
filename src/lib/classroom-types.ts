import type { Course, Lesson, CodeLanguage } from '@/lib/data-provider';

export type UserRoleExtended = 'learner' | 'instructor' | 'admin';

export type AssignmentStatus = 'assigned' | 'submitted' | 'graded' | 'late';

export type DripModuleRelease = {
  moduleId: string;
  releaseAt: string;
};

export type ClassroomCourse = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  instructorId: string;
  instructorName: string;
  classCode: string;
  isBuiltIn?: boolean;
  contentCourseId?: string;
  modules?: CourseModule[];
  bootcamp?: import('@/lib/bootcamp-types').BootcampMetadata;
  enrolledStudentIds: string[];
  /** ISO dates per module — content unlocks on schedule */
  dripSchedule?: DripModuleRelease[];
  /** Classroom course IDs learners should complete first */
  prerequisiteCourseIds?: string[];
  /** One-time purchase price in cents (0 = free) */
  priceCents?: number;
  /** Listed for sale in catalog */
  isForSale?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseBundle = {
  id: string;
  title: string;
  description: string;
  courseIds: string[];
  instructorId: string;
  priceCents?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseModule = {
  id: string;
  title: string;
  lessonIds: string[];
};

export type StreamPost = {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  type: 'announcement' | 'assignment' | 'material';
  title: string;
  content: string;
  attachmentUrls?: string[];
  assignmentId?: string;
  createdAt: Date;
  commentCount: number;
};

export type PostComment = {
  id: string;
  postId: string;
  courseId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
};

export type AssignmentSubmissionType = 'standard' | 'code';

export type ClassroomAssignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  deadline: Date;
  points: number;
  attachmentUrls?: string[];
  /** Use `code` for programming classrooms — shows the online code editor. */
  submissionType?: AssignmentSubmissionType;
  codeLanguage?: CodeLanguage;
  starterCode?: string;
  createdBy: string;
  createdAt: Date;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  textResponse?: string;
  codeSubmission?: string;
  fileUrls?: string[];
  githubUrl?: string;
  liveUrl?: string;
  status: AssignmentStatus;
  grade?: number;
  instructorFeedback?: string;
  aiFeedback?: string;
  submittedAt?: Date;
  gradedAt?: Date;
};

export type QuizAttempt = {
  id: string;
  courseId: string;
  lessonId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  completedAt: Date;
};

export type TeachModeCoursePayload = {
  topic: string;
  title: string;
  description: string;
  roadmap: string;
  weeklyPlan: string;
  modules: { title: string; lessons: { title: string; summary: string }[] }[];
  course: Course;
};

export function groupLessonsIntoModules(lessons: Lesson[]): CourseModule[] {
  const chunkSize = 3;
  const modules: CourseModule[] = [];
  for (let i = 0; i < lessons.length; i += chunkSize) {
    const slice = lessons.slice(i, i + chunkSize);
    modules.push({
      id: `module-${Math.floor(i / chunkSize) + 1}`,
      title: `Module ${Math.floor(i / chunkSize) + 1}`,
      lessonIds: slice.map((l) => l.id),
    });
  }
  return modules;
}

export type InstructorStudentRosterEntry = {
  studentId: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  progressPercent: number;
  assignmentsSubmitted: number;
  assignmentsGraded: number;
  assignmentsTotal: number;
  projectSubmissions: number;
};

export type CourseSubmissionWithAssignment = {
  submission: AssignmentSubmission;
  assignment: ClassroomAssignment;
};

export type InstructorCourseInsightsSummary = {
  studentCount: number;
  assignmentCount: number;
  submissionCount: number;
  pendingGrading: number;
  projectReportCount: number;
  averageProgress: number;
};

export function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
