import type { Course, Lesson } from './data-provider';
import type { ClassroomSlideGeneratorOutput, ClassroomSlide } from '@/ai/flows/classroom-slide-generator-flow';
import { SLIDE_DECK_COUNTS, type SlideDeckLength, type SlideTreatment } from '@/lib/learning-experience';

export type LessonSlideDeckOptions = {
  slideCount?: number;
  deckLength?: SlideDeckLength;
  treatment?: SlideTreatment;
};

/** A usable presentation of existing course material when AI is unavailable. */
export function createLessonSlideDeck(course: Pick<Course, 'title'>, lesson: Lesson, options: LessonSlideDeckOptions = {}): ClassroomSlideGeneratorOutput {
  const count = options.deckLength ? SLIDE_DECK_COUNTS[options.deckLength] : Math.max(3, Math.min(24, Math.round(options.slideCount ?? 14)));
  const treatment = options.treatment ?? 'visual';
  const duration = Math.max(30, Math.min(180, Math.round(lesson.duration * 60 / count)));
  const slide = (id: string, title: string, content: string, type: ClassroomSlide['type'], interactive = false): ClassroomSlide => {
    const description = `Explore ${title} in ${lesson.title}.`;
    return {
      id, title: title.slice(0, 160), content: content.slice(0, 2400), type, duration, interactive,
      visualType: type === 'concept' ? 'diagram' : 'code', visualDescription: description,
      keyPoints: [title.slice(0, 160)], examples: [],
      visualData: { type: type === 'concept' ? 'diagram' : 'code', data: { description } },
    };
  };
  const objectives = lesson.objectives ?? [];
  const notes: string[] = [];
  const concepts = lesson.introduction.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(item => item.trim()).filter(Boolean) || [lesson.introduction.text];
  const pool: ClassroomSlide[] = [
    ...objectives.map((objective, index) => slide(`objective-${index}`, `Learning target ${index + 1}`, `${objective}\n\nHow will you demonstrate this in ${lesson.project.title}?`, 'concept', treatment !== 'visual')),
    ...concepts.slice(0, 8).map((concept, index) => slide(`concept-${index}`, `Core idea ${index + 1}`, `${concept}\n\nExplain this idea using an example connected to ${lesson.project.title}.`, 'concept', treatment === 'challenge')),
    ...lesson.practice.questions.map((question, index) => {
      notes.push(`Checkpoint ${index + 1}: ${question.correctAnswer}`);
      return slide(`checkpoint-${index}`, `${treatment === 'challenge' ? 'Mission checkpoint' : 'Knowledge checkpoint'} ${index + 1}`,
        `### ${question.question}\n${question.options.map(option => `- ${option}`).join('\n')}\n\nChoose an answer and explain the reason before checking the lesson practice.`, 'practice', true);
    }),
    ...(lesson.activities ?? []).map((activity, index) => slide(`lab-${index}`, activity.title,
      `${activity.description}\n\nSuccess check: save evidence of your attempt and explain one decision.`, 'practice', true)),
    ...lesson.assessment.questions.map((question, index) => {
      notes.push(`Transfer challenge ${index + 1}: ${question.correctAnswer}`);
      return slide(`assessment-${index}`, `Transfer challenge ${index + 1}`,
        `### ${question.question}\n${question.options.map(option => `- ${option}`).join('\n')}\n\nAnswer without your notes, then explain how the idea applies to the project.`, 'practice', true);
    }),
  ];
  const needed = count - 3;
  const selected: ClassroomSlide[] = [];
  for (let index = 0; index < needed; index++) {
    if (pool.length >= needed) {
      selected.push(pool[Math.floor(index * pool.length / needed)]);
    } else if (index < pool.length) {
      selected.push(pool[index]);
    } else {
      const prompts = ['Explain the core idea in your own words.', 'Connect the idea to one decision in the project.', 'Identify a question you still need to answer.', 'Use the lesson to review your project draft.'];
      selected.push(slide(`recall-${index}`, `Retrieval round ${index - pool.length + 1}`,
        `${prompts[(index - pool.length) % prompts.length]}\n\nLesson source: ${concepts[index % concepts.length]}`, 'practice', true));
    }
  }
  const slides: ClassroomSlide[] = [
    slide('intro', `${treatment === 'challenge' ? 'Your mission: ' : ''}${lesson.title}`, `# ${lesson.title}\n\n${course.title}\n\n${lesson.introduction.text}`, 'introduction'),
    ...selected,
    slide('project', `${treatment === 'challenge' ? 'Boss mission: ' : ''}${lesson.project.title}`, `${lesson.project.description}\n\nSuccess check: create the requested artifact and explain how it applies the lesson.`, 'example', true),
    slide('summary', 'Review and next steps', lesson.keyTakeaways?.length
      ? lesson.keyTakeaways.map(item => `- ${item}`).join('\n')
      : `Review ${lesson.title}, complete the project, and use the lesson assessment to check your understanding.`, 'summary'),
  ];
  return {
    slides, totalDuration: slides.reduce((sum, item) => sum + item.duration, 0),
    learningObjectives: objectives, visualElements: [],
    interactiveElements: slides.filter(item => item.interactive).map(item => ({ type: item.type, description: item.title, slideId: item.id })),
    teachingNotes: `Slides assembled from existing lesson material.\n\nCheckpoint answer key:\n${notes.join('\n')}`,
    generationConfig: {
      slideCount: count, treatment, learningLevel: 'intermediate', visualStyle: 'interactive',
      deckLength: options.deckLength, enrichVisuals: false,
    },
  };
}
