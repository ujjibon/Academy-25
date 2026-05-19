import type { Course, Lesson } from '@/lib/data-provider';

export type UserRoleExtended = 'learner' | 'instructor' | 'admin';

export type AssignmentStatus = 'assigned' | 'submitted' | 'graded' | 'late';

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
  enrolledStudentIds: string[];
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

export type ClassroomAssignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  deadline: Date;
  points: number;
  attachmentUrls?: string[];
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

export function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
