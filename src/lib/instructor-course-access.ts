import { isAdminProfile } from '@/lib/admin';
import { getClassroomCourse } from '@/lib/classroom-service';
import type { UserProfile } from '@/lib/firebase';
import type { ClassroomCourse } from '@/lib/classroom-types';

/** True when this user teaches the course (not merely enrolled as a student). */
export function isOwnerOfClassroom(
  course: Pick<ClassroomCourse, 'instructorId'> | null | undefined,
  userId: string | null | undefined,
  email?: string | null,
  profile?: Pick<UserProfile, 'role' | 'email'> | null
): boolean {
  if (!course || !userId) return false;
  if (isAdminProfile(profile, email)) return true;
  return course.instructorId === userId;
}

/** Load a classroom only if the instructor owns it (admins may access any). */
export async function getClassroomCourseForInstructor(
  courseId: string,
  instructorId: string,
  email?: string | null
): Promise<ClassroomCourse | null> {
  const course = await getClassroomCourse(courseId);
  if (!course) return null;
  if (!isOwnerOfClassroom(course, instructorId, email)) return null;
  return course;
}

export function isProjectStyleAssignment(assignment: {
  title: string;
  description: string;
}): boolean {
  const text = `${assignment.title} ${assignment.description}`.toLowerCase();
  return (
    text.includes('project') ||
    text.includes('report') ||
    text.includes('capstone') ||
    text.includes('portfolio') ||
    text.includes('submission')
  );
}
