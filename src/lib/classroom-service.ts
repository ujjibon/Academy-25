'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, shouldAttemptFirestoreOperation } from '@/lib/firebase';
import type { Course } from '@/lib/data-provider';
import {
  type ClassroomCourse,
  type StreamPost,
  type PostComment,
  type ClassroomAssignment,
  type AssignmentSubmission,
  type QuizAttempt,
  generateClassCode,
  groupLessonsIntoModules,
} from '@/lib/classroom-types';
import { courses as builtInCatalog } from '@/lib/courses';
import { getCourse } from '@/lib/data-provider';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function mapClassroomCourse(id: string, data: Record<string, unknown>): ClassroomCourse {
  return {
    id,
    title: (data.title as string) || '',
    description: (data.description as string) || '',
    coverImage: (data.coverImage as string) || '/images/react-fundamentals.jpg',
    instructorId: (data.instructorId as string) || '',
    instructorName: (data.instructorName as string) || 'Instructor',
    classCode: (data.classCode as string) || '',
    isBuiltIn: Boolean(data.isBuiltIn),
    contentCourseId: data.contentCourseId as string | undefined,
    modules: data.modules as ClassroomCourse['modules'],
    enrolledStudentIds: (data.enrolledStudentIds as string[]) || [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getClassroomCourse(courseId: string): Promise<ClassroomCourse | null> {
  if (!shouldAttemptFirestoreOperation()) return null;
  const snap = await getDoc(doc(db, 'classroomCourses', courseId));
  if (!snap.exists()) return null;
  return mapClassroomCourse(snap.id, snap.data());
}

export async function getClassroomCourseByCode(classCode: string): Promise<ClassroomCourse | null> {
  if (!shouldAttemptFirestoreOperation()) return null;
  const q = query(
    collection(db, 'classroomCourses'),
    where('classCode', '==', classCode.toUpperCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapClassroomCourse(d.id, d.data());
}

export async function getUserEnrolledCourses(userId: string): Promise<ClassroomCourse[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(
    collection(db, 'classroomCourses'),
    where('enrolledStudentIds', 'array-contains', userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapClassroomCourse(d.id, d.data()));
}

export async function getInstructorCourses(instructorId: string): Promise<ClassroomCourse[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(
    collection(db, 'classroomCourses'),
    where('instructorId', '==', instructorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapClassroomCourse(d.id, d.data()));
}

export async function getAllClassroomCourses(): Promise<ClassroomCourse[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const snap = await getDocs(collection(db, 'classroomCourses'));
  return snap.docs.map((d) => mapClassroomCourse(d.id, d.data()));
}

export async function createClassroomCourse(params: {
  title: string;
  description: string;
  coverImage: string;
  instructorId: string;
  instructorName: string;
  contentCourseId?: string;
  courseContent?: Course;
  isBuiltIn?: boolean;
}): Promise<ClassroomCourse> {
  const courseId = params.contentCourseId || `course-${Date.now()}`;
  let classCode = generateClassCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await getClassroomCourseByCode(classCode);
    if (!existing) break;
    classCode = generateClassCode();
    attempts++;
  }

  const modules = params.courseContent
    ? groupLessonsIntoModules(params.courseContent.lessons)
    : undefined;

  const classroom: Omit<ClassroomCourse, 'id'> & { id: string } = {
    id: courseId,
    title: params.title,
    description: params.description,
    coverImage: params.coverImage,
    instructorId: params.instructorId,
    instructorName: params.instructorName,
    classCode,
    isBuiltIn: params.isBuiltIn,
    contentCourseId: params.contentCourseId || courseId,
    modules,
    enrolledStudentIds: [params.instructorId],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, 'classroomCourses', courseId), {
    ...classroom,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (params.courseContent) {
    await setDoc(doc(db, 'courseContent', courseId), params.courseContent);
  }

  return classroom;
}

export async function joinCourseByCode(
  classCode: string,
  userId: string
): Promise<ClassroomCourse> {
  const course = await getClassroomCourseByCode(classCode.trim().toUpperCase());
  if (!course) throw new Error('Invalid class code. Please check and try again.');
  if (course.enrolledStudentIds.includes(userId)) return course;

  await updateDoc(doc(db, 'classroomCourses', course.id), {
    enrolledStudentIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });

  return { ...course, enrolledStudentIds: [...course.enrolledStudentIds, userId] };
}

export async function getCourseContent(courseId: string): Promise<Course | null> {
  const fromFirestore = await getDoc(doc(db, 'courseContent', courseId));
  if (fromFirestore.exists()) {
    return fromFirestore.data() as Course;
  }
  return getCourse(courseId) ?? null;
}

export async function seedBuiltInClassroomCourses(
  instructorId: string,
  instructorName: string
): Promise<number> {
  let seeded = 0;
  for (const info of builtInCatalog) {
    const existing = await getClassroomCourse(info.id);
    if (existing) continue;

    const content = getCourse(info.id);
    if (!content) continue;

    await createClassroomCourse({
      title: info.title,
      description: info.description,
      coverImage: info.image,
      instructorId,
      instructorName,
      contentCourseId: info.id,
      courseContent: content,
      isBuiltIn: true,
    });
    seeded++;
  }
  return seeded;
}

// Stream posts
export async function getStreamPosts(courseId: string): Promise<StreamPost[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(
    collection(db, 'classroomCourses', courseId, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      courseId,
      authorId: data.authorId,
      authorName: data.authorName,
      authorPhoto: data.authorPhoto,
      type: data.type,
      title: data.title,
      content: data.content,
      attachmentUrls: data.attachmentUrls,
      assignmentId: data.assignmentId,
      createdAt: toDate(data.createdAt),
      commentCount: data.commentCount || 0,
    } as StreamPost;
  });
}

export async function createStreamPost(
  courseId: string,
  post: Omit<StreamPost, 'id' | 'courseId' | 'createdAt' | 'commentCount'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'classroomCourses', courseId, 'posts'), {
    ...post,
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPostComments(courseId: string, postId: string): Promise<PostComment[]> {
  const q = query(
    collection(db, 'classroomCourses', courseId, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      postId,
      courseId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content,
      createdAt: toDate(data.createdAt),
    } as PostComment;
  });
}

export async function addPostComment(
  courseId: string,
  postId: string,
  comment: Omit<PostComment, 'id' | 'postId' | 'courseId' | 'createdAt'>
): Promise<void> {
  await addDoc(
    collection(db, 'classroomCourses', courseId, 'posts', postId, 'comments'),
    { ...comment, createdAt: serverTimestamp() }
  );
  const postRef = doc(db, 'classroomCourses', courseId, 'posts', postId);
  const postSnap = await getDoc(postRef);
  const count = (postSnap.data()?.commentCount || 0) + 1;
  await updateDoc(postRef, { commentCount: count });
}

// Assignments
export async function getCourseAssignments(courseId: string): Promise<ClassroomAssignment[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(
    collection(db, 'classroomCourses', courseId, 'assignments'),
    orderBy('deadline', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      courseId,
      title: data.title,
      description: data.description,
      deadline: toDate(data.deadline),
      points: data.points || 100,
      attachmentUrls: data.attachmentUrls,
      createdBy: data.createdBy,
      createdAt: toDate(data.createdAt),
    } as ClassroomAssignment;
  });
}

export async function createAssignment(
  assignment: Omit<ClassroomAssignment, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'classroomCourses', assignment.courseId, 'assignments'),
    { ...assignment, createdAt: serverTimestamp() }
  );

  await createStreamPost(assignment.courseId, {
    authorId: assignment.createdBy,
    authorName: 'Instructor',
    type: 'assignment',
    title: `New assignment: ${assignment.title}`,
    content: assignment.description,
    assignmentId: ref.id,
  });

  return ref.id;
}

export async function getAssignment(
  courseId: string,
  assignmentId: string
): Promise<ClassroomAssignment | null> {
  const snap = await getDoc(
    doc(db, 'classroomCourses', courseId, 'assignments', assignmentId)
  );
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    courseId,
    title: data.title,
    description: data.description,
    deadline: toDate(data.deadline),
    points: data.points || 100,
    attachmentUrls: data.attachmentUrls,
    createdBy: data.createdBy,
    createdAt: toDate(data.createdAt),
  };
}

export async function getStudentSubmission(
  courseId: string,
  assignmentId: string,
  studentId: string
): Promise<AssignmentSubmission | null> {
  const q = query(
    collection(db, 'classroomCourses', courseId, 'assignments', assignmentId, 'submissions'),
    where('studentId', '==', studentId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    assignmentId,
    courseId,
    studentId: data.studentId,
    studentName: data.studentName,
    textResponse: data.textResponse,
    fileUrls: data.fileUrls,
    githubUrl: data.githubUrl,
    liveUrl: data.liveUrl,
    status: data.status,
    grade: data.grade,
    instructorFeedback: data.instructorFeedback,
    aiFeedback: data.aiFeedback,
    submittedAt: data.submittedAt ? toDate(data.submittedAt) : undefined,
    gradedAt: data.gradedAt ? toDate(data.gradedAt) : undefined,
  };
}

export async function submitAssignment(
  submission: Omit<AssignmentSubmission, 'id' | 'submittedAt' | 'gradedAt'>
): Promise<string> {
  const existing = await getStudentSubmission(
    submission.courseId,
    submission.assignmentId,
    submission.studentId
  );

  const payload = {
    ...submission,
    submittedAt: serverTimestamp(),
  };

  if (existing) {
    await updateDoc(
      doc(
        db,
        'classroomCourses',
        submission.courseId,
        'assignments',
        submission.assignmentId,
        'submissions',
        existing.id
      ),
      payload
    );
    return existing.id;
  }

  const ref = await addDoc(
    collection(
      db,
      'classroomCourses',
      submission.courseId,
      'assignments',
      submission.assignmentId,
      'submissions'
    ),
    payload
  );
  return ref.id;
}

export async function getUpcomingAssignmentsForUser(
  userId: string,
  limitCount = 5
): Promise<(ClassroomAssignment & { courseTitle: string })[]> {
  const enrolled = await getUserEnrolledCourses(userId);
  const upcoming: (ClassroomAssignment & { courseTitle: string })[] = [];

  for (const course of enrolled) {
    const assignments = await getCourseAssignments(course.id);
    const now = new Date();
    for (const a of assignments) {
      if (a.deadline >= now) {
        upcoming.push({ ...a, courseTitle: course.title });
      }
    }
  }

  return upcoming
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, limitCount);
}

export async function saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<void> {
  await addDoc(collection(db, 'quizAttempts'), {
    ...attempt,
    completedAt: serverTimestamp(),
  });
}

export async function getCourseEnrollmentsWithProgress(
  courseId: string
): Promise<{ studentId: string; progress: number }[]> {
  const course = await getClassroomCourse(courseId);
  if (!course) return [];
  const results: { studentId: string; progress: number }[] = [];

  for (const studentId of course.enrolledStudentIds) {
    if (studentId === course.instructorId) continue;
    const userSnap = await getDoc(doc(db, 'users', studentId));
    const progress = userSnap.data()?.courseProgress?.[course.contentCourseId || courseId] || 0;
    results.push({ studentId, progress });
  }
  return results;
}
