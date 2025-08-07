
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
    image: '/images/react-fundamentals.jpg',
  },
  {
    id: 'advanced-css',
    title: 'Advanced CSS and Sass',
    description: 'Level up your styling skills with Flexbox, Grid, and Sass.',
    image: '/images/advanced-css.jpg',
  },
  {
    id: 'digital-productivity-mastery',
    title: 'Digital Productivity Mastery',
    description: 'Essential Tools for the Modern Workforce. Master Google Workspace, Microsoft Office, Notion, and Canva.',
    image: '/images/digital-productivity-mastery.jpg',
  },
  {
    id: 'Python-SP-101',
    title: 'Python Fundamentals for Beginners',
    description: 'Build a strong foundation in Python with this beginner-friendly course.',
    image: '/images/1754598826269-python.jpg',
  },
];
