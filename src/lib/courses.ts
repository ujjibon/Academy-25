
export type CourseInfo = {
  id: string;
  title: string;
  description: string;
  image: string;
};

export const courses: CourseInfo[] = [
  {
    id: 'react-fundamentals',
    title: 'React Fundamentals',
    description: 'Learn the basics of React to build modern web applications.',
    image: 'https://placehold.co/600x400.png',
  },
  {
    id: 'advanced-css',
    title: 'Advanced CSS and Sass',
    description: 'Level up your styling skills with Flexbox, Grid, and Sass.',
    image: 'https://placehold.co/600x400.png',
  },
  {
    id: 'digital-productivity-mastery',
    title: 'Digital Productivity Mastery',
    description: 'Essential Tools for the Modern Workforce. Master Google Workspace, Microsoft Office, Notion, and Canva.',
    image: 'https://placehold.co/600x400.png',
  },
];
