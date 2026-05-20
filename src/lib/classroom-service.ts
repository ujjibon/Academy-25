'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
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

async function getOwnedClassroomCourse(
  courseId: string,
  instructorId: string
): Promise<ClassroomCourse | null> {
  const course = await getClassroomCourse(courseId);
  if (!course || course.instructorId !== instructorId) return null;
  return course;
}
import {
  type ClassroomCourse,
  type StreamPost,
  type PostComment,
  type ClassroomAssignment,
  type AssignmentSubmission,
  type QuizAttempt,
  type InstructorStudentRosterEntry,
  type CourseSubmissionWithAssignment,
  type InstructorCourseInsightsSummary,
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
    bootcamp: data.bootcamp as ClassroomCourse['bootcamp'],
    enrolledStudentIds: (data.enrolledStudentIds as string[]) || [],
    dripSchedule: data.dripSchedule as ClassroomCourse['dripSchedule'],
    prerequisiteCourseIds: (data.prerequisiteCourseIds as string[]) || undefined,
    priceCents: data.priceCents as number | undefined,
    isForSale: Boolean(data.isForSale),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapCourseBundle(id: string, data: Record<string, unknown>): import('@/lib/classroom-types').CourseBundle {
  return {
    id,
    title: (data.title as string) || '',
    description: (data.description as string) || '',
    courseIds: (data.courseIds as string[]) || [],
    instructorId: (data.instructorId as string) || '',
    priceCents: data.priceCents as number | undefined,
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

  const { met, missing } = await checkCoursePrerequisites(userId, course);
  if (!met && missing.length > 0) {
    throw new Error(
      `Complete prerequisite course(s) first: ${missing.map((m) => m.title).join(', ')}`
    );
  }

  await updateDoc(doc(db, 'classroomCourses', course.id), {
    enrolledStudentIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });

  return { ...course, enrolledStudentIds: [...course.enrolledStudentIds, userId] };
}

export async function updateClassroomCourseMetadata(
  courseId: string,
  instructorId: string,
  updates: Partial<Pick<ClassroomCourse, 'title' | 'description' | 'coverImage'>>
): Promise<void> {
  const owned = await getOwnedClassroomCourse(courseId, instructorId);
  if (!owned) throw new Error('You can only edit courses you teach.');

  await updateDoc(doc(db, 'classroomCourses', courseId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getModulesForClassroomCourse(
  course: ClassroomCourse
): Promise<import('@/lib/classroom-types').CourseModule[]> {
  if (course.modules?.length) return course.modules;
  const contentId = course.contentCourseId || course.id;
  const content = await getCourseContent(contentId);
  if (content?.lessons?.length) return groupLessonsIntoModules(content.lessons);
  return [];
}

export async function updateClassroomCourseSettings(
  courseId: string,
  instructorId: string,
  updates: Partial<
    Pick<
      ClassroomCourse,
      | 'dripSchedule'
      | 'prerequisiteCourseIds'
      | 'priceCents'
      | 'isForSale'
      | 'modules'
    >
  >
): Promise<void> {
  const owned = await getOwnedClassroomCourse(courseId, instructorId);
  if (!owned) throw new Error('You can only edit courses you teach.');

  await updateDoc(doc(db, 'classroomCourses', courseId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getInstructorAssignments(
  instructorId: string
): Promise<(ClassroomAssignment & { courseTitle: string })[]> {
  const courses = await getInstructorCourses(instructorId);
  const rows: (ClassroomAssignment & { courseTitle: string })[] = [];
  for (const course of courses) {
    const assignments = await getCourseAssignments(course.id);
    for (const a of assignments) {
      rows.push({ ...a, courseTitle: course.title });
    }
  }
  return rows.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}

export async function getInstructorBundles(instructorId: string) {
  if (!shouldAttemptFirestoreOperation()) return [];
  const q = query(
    collection(db, 'courseBundles'),
    where('instructorId', '==', instructorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCourseBundle(d.id, d.data()));
}

export async function getPublishedBundles(): Promise<import('@/lib/classroom-types').CourseBundle[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const snap = await getDocs(collection(db, 'courseBundles'));
  return snap.docs.map((d) => mapCourseBundle(d.id, d.data()));
}

export async function saveCourseBundle(
  instructorId: string,
  bundle: Omit<import('@/lib/classroom-types').CourseBundle, 'createdAt' | 'updatedAt'> & {
    id?: string;
  }
): Promise<string> {
  const payload = {
    title: bundle.title,
    description: bundle.description,
    courseIds: bundle.courseIds,
    instructorId,
    priceCents: bundle.priceCents ?? 0,
    updatedAt: serverTimestamp(),
  };
  if (bundle.id) {
    await updateDoc(doc(db, 'courseBundles', bundle.id), payload);
    return bundle.id;
  }
  const ref = await addDoc(collection(db, 'courseBundles'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteCourseBundle(
  bundleId: string,
  instructorId: string
): Promise<void> {
  const snap = await getDoc(doc(db, 'courseBundles', bundleId));
  if (!snap.exists() || (snap.data().instructorId as string) !== instructorId) {
    throw new Error('Bundle not found or access denied.');
  }
  await deleteDoc(doc(db, 'courseBundles', bundleId));
}

export async function checkCoursePrerequisites(
  userId: string,
  course: ClassroomCourse
): Promise<{ met: boolean; missing: ClassroomCourse[] }> {
  const ids = course.prerequisiteCourseIds ?? [];
  if (ids.length === 0) return { met: true, missing: [] };

  const enrolled = await getUserEnrolledCourses(userId);
  const enrolledIds = new Set(enrolled.map((c) => c.id));
  const missing: ClassroomCourse[] = [];

  for (const prereqId of ids) {
    if (!enrolledIds.has(prereqId)) {
      const prereq = await getClassroomCourse(prereqId);
      if (prereq) missing.push(prereq);
    }
  }

  return { met: missing.length === 0, missing };
}

export function isModuleReleased(
  course: ClassroomCourse,
  moduleId: string
): boolean {
  const schedule = course.dripSchedule ?? [];
  const entry = schedule.find((s) => s.moduleId === moduleId);
  if (!entry) return true;
  return new Date(entry.releaseAt) <= new Date();
}

export async function getLearnerGradebook(
  userId: string
): Promise<
  {
    courseId: string;
    courseTitle: string;
    assignmentTitle: string;
    assignmentId: string;
    grade?: number;
    points: number;
    status: string;
  }[]
> {
  const enrolled = await getUserEnrolledCourses(userId);
  const rows: {
    courseId: string;
    courseTitle: string;
    assignmentTitle: string;
    assignmentId: string;
    grade?: number;
    points: number;
    status: string;
  }[] = [];

  for (const course of enrolled) {
    const assignments = await getCourseAssignments(course.id);
    for (const a of assignments) {
      const subs = await getAssignmentSubmissions(course.id, a.id);
      const mine = subs.find((s) => s.studentId === userId);
      rows.push({
        courseId: course.id,
        courseTitle: course.title,
        assignmentTitle: a.title,
        assignmentId: a.id,
        grade: mine?.grade,
        points: a.points,
        status: mine?.status ?? 'assigned',
      });
    }
  }
  return rows;
}

export async function getCoursesForSale(): Promise<ClassroomCourse[]> {
  const all = await getAllClassroomCourses();
  return all.filter((c) => c.isForSale);
}

export async function getLearnerAnalytics(
  userId: string,
  courseProgress: Record<string, number> = {}
) {
  const enrolled = await getUserEnrolledCourses(userId);
  const gradebook = await getLearnerGradebook(userId);
  const graded = gradebook.filter((r) => r.grade != null && r.points > 0);
  const averageScorePercent =
    graded.length > 0
      ? Math.round(
          graded.reduce((sum, r) => sum + ((r.grade ?? 0) / r.points) * 100, 0) /
            graded.length
        )
      : 0;
  const courseBreakdown = enrolled.map((c) => ({
    id: c.id,
    title: c.title,
    progress: courseProgress[c.contentCourseId || c.id] ?? 0,
    classCode: c.classCode,
  }));
  const avgProgress =
    courseBreakdown.length > 0
      ? Math.round(
          courseBreakdown.reduce((s, c) => s + c.progress, 0) / courseBreakdown.length
        )
      : 0;

  return {
    coursesEnrolled: enrolled.length,
    assignmentsTotal: gradebook.length,
    assignmentsSubmitted: gradebook.filter(
      (r) => r.status === 'submitted' || r.status === 'graded' || r.status === 'late'
    ).length,
    assignmentsGraded: graded.length,
    averageScorePercent,
    avgProgress,
    courseBreakdown,
  };
}

export async function joinBundleCourses(
  bundleId: string,
  userId: string
): Promise<{ joined: string[]; skipped: string[] }> {
  const snap = await getDoc(doc(db, 'courseBundles', bundleId));
  if (!snap.exists()) throw new Error('Bundle not found');
  const courseIds = (snap.data().courseIds as string[]) || [];
  const joined: string[] = [];
  const skipped: string[] = [];

  for (const courseId of courseIds) {
    const course = await getClassroomCourse(courseId);
    if (!course) continue;
    if (course.enrolledStudentIds.includes(userId)) {
      skipped.push(courseId);
      continue;
    }
    const { met, missing } = await checkCoursePrerequisites(userId, course);
    if (!met && missing.length > 0) {
      throw new Error(
        `Prerequisites required for ${course.title}: ${missing.map((m) => m.title).join(', ')}`
      );
    }
    await updateDoc(doc(db, 'classroomCourses', courseId), {
      enrolledStudentIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
    joined.push(courseId);
  }
  return { joined, skipped };
}

export async function getInstructorAnalyticsSummary(instructorId: string) {
  const courses = await getInstructorCourses(instructorId);
  let totalStudents = 0;
  let totalAssignments = 0;
  let pendingGrading = 0;
  let totalSubmissions = 0;

  for (const course of courses) {
    const students = course.enrolledStudentIds.filter((id) => id !== course.instructorId);
    totalStudents += students.length;
    const assignments = await getCourseAssignments(course.id);
    totalAssignments += assignments.length;
    const subs = await getAllSubmissionsForCourse(course.id);
    totalSubmissions += subs.length;
    pendingGrading += subs.filter(
      (r) => r.submission.status === 'submitted' || r.submission.status === 'late'
    ).length;
  }

  return {
    courseCount: courses.length,
    totalStudents,
    totalAssignments,
    totalSubmissions,
    pendingGrading,
    courses,
  };
}

export async function saveClassroomCourseContent(
  courseId: string,
  instructorId: string,
  content: Course
): Promise<void> {
  const owned = await getOwnedClassroomCourse(courseId, instructorId);
  if (!owned) throw new Error('You can only edit courses you teach.');

  const contentId = owned.contentCourseId || courseId;
  const modules = groupLessonsIntoModules(content.lessons);

  await setDoc(doc(db, 'courseContent', contentId), {
    ...content,
    id: contentId,
    image: content.image || owned.coverImage,
  });

  await updateDoc(doc(db, 'classroomCourses', courseId), {
    title: content.title,
    description: content.description,
    coverImage: content.image || owned.coverImage,
    contentCourseId: contentId,
    modules,
    updatedAt: serverTimestamp(),
  });
}

export async function loadClassroomCourseForEditing(
  courseId: string,
  instructorId: string
): Promise<{ classroom: ClassroomCourse; content: Course } | null> {
  const classroom = await getOwnedClassroomCourse(courseId, instructorId);
  if (!classroom) return null;

  const contentId = classroom.contentCourseId || classroom.id;
  let content = await getCourseContent(contentId);

  if (!content) {
    content = {
      id: contentId,
      title: classroom.title,
      description: classroom.description,
      image: classroom.coverImage,
      lessons: [],
    };
  }

  return { classroom, content };
}

export function createBlankCourseContent(
  title: string,
  description: string,
  image: string
): Course {
  const slug = `course-${Date.now()}`;
  return {
    id: slug,
    title: title.trim() || 'New course',
    description: description.trim() || 'Course description',
    image: image || '/images/react-fundamentals.jpg',
    lessons: [
      {
        id: '1',
        title: 'Introduction',
        duration: 15,
        introduction: {
          text: 'Welcome to this course. Replace this with your lesson introduction.',
        },
        practice: { questions: [] },
        project: { title: 'Practice project', description: 'Describe the practice project.' },
        assessment: { questions: [] },
      },
    ],
  };
}

export async function createManualClassroomWithContent(params: {
  title: string;
  description: string;
  coverImage: string;
  instructorId: string;
  instructorName: string;
  withStarterLesson?: boolean;
}): Promise<ClassroomCourse> {
  const content = params.withStarterLesson
    ? createBlankCourseContent(params.title, params.description, params.coverImage)
    : {
        id: `course-${Date.now()}`,
        title: params.title.trim(),
        description: params.description.trim() || 'A new course on Peer Academy',
        image: params.coverImage || '/images/react-fundamentals.jpg',
        lessons: [],
      };

  return createClassroomCourse({
    title: params.title.trim(),
    description: params.description.trim() || 'A new course on Peer Academy',
    coverImage: params.coverImage || '/images/react-fundamentals.jpg',
    instructorId: params.instructorId,
    instructorName: params.instructorName,
    contentCourseId: content.id,
    courseContent: content,
  });
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
      submissionType: data.submissionType,
      codeLanguage: data.codeLanguage,
      starterCode: data.starterCode,
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
    submissionType: data.submissionType,
    codeLanguage: data.codeLanguage,
    starterCode: data.starterCode,
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
    codeSubmission: data.codeSubmission,
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

function mapSubmission(
  d: { id: string; data: () => Record<string, unknown> },
  assignmentId: string,
  courseId: string
): AssignmentSubmission {
  const data = d.data();
  return {
    id: d.id,
    assignmentId,
    courseId,
    studentId: data.studentId as string,
    studentName: data.studentName as string,
    textResponse: data.textResponse as string | undefined,
    codeSubmission: data.codeSubmission as string | undefined,
    fileUrls: data.fileUrls as string[] | undefined,
    githubUrl: data.githubUrl as string | undefined,
    liveUrl: data.liveUrl as string | undefined,
    status: data.status as AssignmentSubmission['status'],
    grade: data.grade as number | undefined,
    instructorFeedback: data.instructorFeedback as string | undefined,
    aiFeedback: data.aiFeedback as string | undefined,
    submittedAt: data.submittedAt ? toDate(data.submittedAt) : undefined,
    gradedAt: data.gradedAt ? toDate(data.gradedAt) : undefined,
  };
}

export async function getAssignmentSubmissions(
  courseId: string,
  assignmentId: string
): Promise<AssignmentSubmission[]> {
  if (!shouldAttemptFirestoreOperation()) return [];
  const snap = await getDocs(
    collection(db, 'classroomCourses', courseId, 'assignments', assignmentId, 'submissions')
  );
  return snap.docs.map((d) => mapSubmission(d, assignmentId, courseId));
}

export async function getAllSubmissionsForCourse(
  courseId: string
): Promise<CourseSubmissionWithAssignment[]> {
  const assignments = await getCourseAssignments(courseId);
  const rows: CourseSubmissionWithAssignment[] = [];
  for (const assignment of assignments) {
    const submissions = await getAssignmentSubmissions(courseId, assignment.id);
    for (const submission of submissions) {
      rows.push({ submission, assignment });
    }
  }
  return rows.sort(
    (a, b) =>
      (b.submission.submittedAt?.getTime() ?? 0) - (a.submission.submittedAt?.getTime() ?? 0)
  );
}

export async function gradeSubmission(
  courseId: string,
  assignmentId: string,
  submissionId: string,
  updates: {
    grade?: number;
    instructorFeedback?: string;
    status?: AssignmentSubmission['status'];
  }
): Promise<void> {
  await updateDoc(
    doc(db, 'classroomCourses', courseId, 'assignments', assignmentId, 'submissions', submissionId),
    {
      ...updates,
      gradedAt: serverTimestamp(),
      status: updates.status ?? 'graded',
    }
  );
}

export async function getInstructorCourseRoster(
  courseId: string
): Promise<InstructorStudentRosterEntry[]> {
  const course = await getClassroomCourse(courseId);
  if (!course) return [];

  const assignments = await getCourseAssignments(courseId);
  const contentId = course.contentCourseId || courseId;
  const studentIds = course.enrolledStudentIds.filter((id) => id !== course.instructorId);
  const roster: InstructorStudentRosterEntry[] = [];

  for (const studentId of studentIds) {
    const userSnap = await getDoc(doc(db, 'users', studentId));
    const userData = userSnap.data();
    const progressPercent = (userData?.courseProgress?.[contentId] as number) ?? 0;

    let assignmentsSubmitted = 0;
    let assignmentsGraded = 0;
    let projectSubmissions = 0;

    for (const assignment of assignments) {
      const sub = await getStudentSubmission(courseId, assignment.id, studentId);
      if (!sub || sub.status === 'assigned') continue;
      assignmentsSubmitted++;
      if (sub.status === 'graded') assignmentsGraded++;
      if (sub.githubUrl || sub.liveUrl || sub.textResponse || sub.codeSubmission) {
        const isProject =
          assignment.title.toLowerCase().includes('project') ||
          assignment.title.toLowerCase().includes('report') ||
          assignment.description.toLowerCase().includes('project');
        if (isProject || sub.githubUrl || sub.liveUrl) projectSubmissions++;
      }
    }

    roster.push({
      studentId,
      displayName: (userData?.displayName as string) || 'Student',
      email: userData?.email as string | undefined,
      photoURL: userData?.photoURL as string | undefined,
      progressPercent,
      assignmentsSubmitted,
      assignmentsGraded,
      assignmentsTotal: assignments.length,
      projectSubmissions,
    });
  }

  return roster.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getInstructorCourseInsightsSummary(
  courseId: string
): Promise<InstructorCourseInsightsSummary> {
  const roster = await getInstructorCourseRoster(courseId);
  const allSubmissions = await getAllSubmissionsForCourse(courseId);
  const assignments = await getCourseAssignments(courseId);

  const pendingGrading = allSubmissions.filter(
    (r) => r.submission.status === 'submitted' || r.submission.status === 'late'
  ).length;

  const projectReportCount = allSubmissions.filter(
    (r) =>
      r.submission.githubUrl ||
      r.submission.liveUrl ||
      r.assignment.title.toLowerCase().includes('project') ||
      r.assignment.title.toLowerCase().includes('report')
  ).length;

  const averageProgress =
    roster.length > 0
      ? Math.round(roster.reduce((s, r) => s + r.progressPercent, 0) / roster.length)
      : 0;

  return {
    studentCount: roster.length,
    assignmentCount: assignments.length,
    submissionCount: allSubmissions.length,
    pendingGrading,
    projectReportCount,
    averageProgress,
  };
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
