'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course, Lesson } from '@/lib/data-provider';
import {
  createAssignment,
  createClassroomCourse,
  createStreamPost,
} from '@/lib/classroom-service';
import type { ClassroomCourse, CourseModule } from '@/lib/classroom-types';
import { groupLessonsIntoModules } from '@/lib/classroom-types';
import type { BootcampPlan } from '@/lib/bootcamp-types';

function buildCourseFromPlan(plan: BootcampPlan): Course {
  const courseId = `bootcamp-${Date.now()}`;
  const lessonMaterials = plan.materials.filter((material) =>
    ['lesson', 'quiz', 'reading', 'worksheet'].includes(material.type)
  );
  const source =
    lessonMaterials.length > 0
      ? lessonMaterials
      : [
          {
            id: 'lesson-1',
            title: plan.title || 'Bootcamp Overview',
            type: 'lesson' as const,
            purpose: plan.summary || plan.description,
          },
        ];

  const lessons: Lesson[] = source.map((material, index) => {
    const linkedProject = plan.projects[index % Math.max(plan.projects.length, 1)];
    return {
      id: material.id || `lesson-${index + 1}`,
      title: material.title,
      duration: 45,
      introduction: {
        text: material.purpose || plan.summary,
      },
      practice: {
        questions: [
          {
            question: `What is the main goal of "${material.title}"?`,
            options: [
              'Apply the concept in practice',
              'Skip this topic',
              'Ignore instructions',
            ],
            correctAnswer: 'Apply the concept in practice',
          },
        ],
      },
      project: linkedProject
        ? {
            title: linkedProject.title,
            description: linkedProject.description,
          }
        : {
            title: 'Practice Project',
            description: 'Apply what you learned in a short deliverable.',
          },
      assessment: {
        questions: [
          {
            question: `Are you ready to continue after "${material.title}"?`,
            options: ['Yes', 'Not yet'],
            correctAnswer: 'Yes',
          },
        ],
      },
    };
  });

  return {
    id: courseId,
    title: plan.title,
    description: plan.description || plan.summary,
    image: plan.coverImage || '/images/react-fundamentals.jpg',
    lessons,
  };
}

function resolveModules(plan: BootcampPlan, lessons: Lesson[]): CourseModule[] {
  if (plan.sections.length === 0) {
    return groupLessonsIntoModules(lessons);
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const modules: CourseModule[] = [];
  const assigned = new Set<string>();

  const sortedSections = [...plan.sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    const sectionMaterials = plan.materials.filter(
      (material) => material.sectionId === section.id
    );
    const sectionLessonIds = sectionMaterials
      .map((material) => material.id)
      .filter((id) => lessonIds.includes(id));

    sectionLessonIds.forEach((id) => assigned.add(id));

    modules.push({
      id: section.id,
      title: section.title,
      lessonIds: sectionLessonIds,
    });
  }

  const unassigned = lessonIds.filter((id) => !assigned.has(id));
  if (unassigned.length > 0) {
    if (modules.length === 0) {
      return groupLessonsIntoModules(lessons);
    }
    modules[modules.length - 1].lessonIds.push(...unassigned);
  }

  const nonEmpty = modules.filter((module) => module.lessonIds.length > 0);
  return nonEmpty.length > 0 ? nonEmpty : groupLessonsIntoModules(lessons);
}

export async function publishBootcampPlan(params: {
  plan: BootcampPlan;
  instructorId: string;
  instructorName: string;
}): Promise<{ classroom: ClassroomCourse; assignmentsCreated: number }> {
  const course = params.plan.course ?? buildCourseFromPlan(params.plan);
  const modules = resolveModules(params.plan, course.lessons);

  const classroom = await createClassroomCourse({
    title: params.plan.title,
    description: params.plan.description || params.plan.summary,
    coverImage: params.plan.coverImage || course.image,
    instructorId: params.instructorId,
    instructorName: params.instructorName,
    contentCourseId: course.id,
    courseContent: course,
  });

  await updateDoc(doc(db, 'classroomCourses', classroom.id), {
    modules,
    bootcamp: {
      summary: params.plan.summary,
      timeline: params.plan.timeline,
      materials: params.plan.materials,
      projects: params.plan.projects,
      taskSubmissionFlow: params.plan.taskSubmissionFlow,
      mentorship: params.plan.mentorship,
      dashboardConfig: params.plan.dashboardConfig,
    },
    updatedAt: serverTimestamp(),
  });

  let assignmentsCreated = 0;
  const startDate = new Date();

  for (let index = 0; index < params.plan.projects.length; index++) {
    const project = params.plan.projects[index];
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + 7 * (index + 1));

    await createAssignment({
      courseId: classroom.id,
      title: project.title,
      description: [
        project.description,
        '',
        'Report requirements:',
        ...project.reportRequirements.map((item) => `- ${item}`),
        '',
        'Submission workflow:',
        ...params.plan.taskSubmissionFlow.workflow.map((step) => `- ${step}`),
        '',
        'Evaluation criteria:',
        ...params.plan.taskSubmissionFlow.evaluationCriteria.map((item) => `- ${item}`),
      ].join('\n'),
      deadline,
      points: project.points || 100,
      createdBy: params.instructorId,
    });
    assignmentsCreated++;
  }

  for (const week of params.plan.timeline) {
    await createStreamPost(classroom.id, {
      authorId: params.instructorId,
      authorName: params.instructorName,
      type: 'announcement',
      title: week.week,
      content: [
        week.objective,
        '',
        'Deliverables:',
        ...week.deliverables.map((deliverable) => `• ${deliverable}`),
      ].join('\n'),
    });
  }

  if (params.plan.mentorship.enabled) {
    await createStreamPost(classroom.id, {
      authorId: params.instructorId,
      authorName: params.instructorName,
      type: 'announcement',
      title: params.plan.mentorship.title,
      content: [
        params.plan.mentorship.description,
        '',
        `Session frequency: ${params.plan.mentorship.sessionFrequency}`,
        '',
        'Mentor focus areas:',
        ...params.plan.mentorship.mentorFocusAreas.map((area) => `• ${area}`),
        '',
        params.plan.mentorship.bookingNotes,
      ].join('\n'),
    });
  }

  return {
    classroom: { ...classroom, modules },
    assignmentsCreated,
  };
}
