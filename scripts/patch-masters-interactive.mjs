import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'src', 'data', 'courses');
const files = fs.readdirSync(dir).filter((f) => f.startsWith('masters-') && f.endsWith('.json'));

function activitiesFromProject(project, lessonTitle) {
  return [
    {
      id: 'explore',
      title: 'Explore the brief',
      description: 'Re-read the project goal and note constraints in 3 bullets.',
    },
    {
      id: 'draft',
      title: 'Build the deliverable',
      description: project.description,
    },
    {
      id: 'reflect',
      title: 'Reflect and ship',
      description: `Write what worked, what you would change, and one reusable template from: ${lessonTitle}`,
    },
  ];
}

for (const f of files) {
  const p = path.join(dir, f);
  const course = JSON.parse(fs.readFileSync(p, 'utf8'));
  course.lessons = course.lessons.map((lesson) => {
    const title = lesson.title;
    const firstSentence =
      (lesson.introduction?.text || '').split(/(?<=\.)\s+/)[0] || title;
    return {
      ...lesson,
      objectives: lesson.objectives?.length
        ? lesson.objectives
        : [
            `Explain the main idea of "${title}" without looking at notes`,
            'Identify one mistake beginners make on this topic and how to avoid it',
            `Complete a concrete artifact for: ${lesson.project.title}`,
          ],
      keyTakeaways: lesson.keyTakeaways?.length
        ? lesson.keyTakeaways
        : [
            firstSentence,
            'Check understanding with practice before you build.',
            'A small shipped artifact beats a perfect unread summary.',
          ],
      activities: lesson.activities?.length
        ? lesson.activities
        : activitiesFromProject(lesson.project, title),
    };
  });
  fs.writeFileSync(p, JSON.stringify(course, null, 2));
  console.log('patched', course.id, course.lessons.length);
}
