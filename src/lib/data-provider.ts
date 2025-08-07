
import { courses as courseList } from './courses';
import advancedCss from '@/data/courses/advanced-css.json';
import digitalProductivity from '@/data/courses/digital-productivity-mastery.json';
import reactFundamentals from '@/data/courses/react-fundamentals.json';
import pythonSP101 from '@/data/courses/Python-SP-101.json';

export type Course = {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: Lesson[];
};

export type Lesson = {
  id: string;
  title: string;
  duration: number; // in minutes
  introduction: {
    videoUrl: string;
    text: string;
  };
  practice: Quiz;
  project: Project;
  assessment: Quiz;
};

export type Quiz = {
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
};

export type Project = {
  title: string;
  description: string;
};

// This is a map of the course IDs to the imported JSON data.
// In a real application, you would fetch this from a database.
const coursesData: { [key: string]: Course } = {
  'react-fundamentals': reactFundamentals,
  'advanced-css': advancedCss,
  'digital-productivity-mastery': digitalProductivity,
  'Python-SP-101': pythonSP101,
};


export const user = {
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  avatar: 'https://placehold.co/100x100.png',
  xp: 1250,
  level: 8,
  dailyStreak: 5,
  weeklyProgress: 60,
  activeCourseId: 'react-fundamentals',
  activeLessonId: '2',
  strengths: [
    { name: 'React', value: 90 },
    { name: 'JavaScript', value: 85 },
    { name: 'CSS', value: 70 },
  ],
  weaknesses: [
    { name: 'State Management', value: 40 },
    { name: 'Testing', value: 30 },
  ],
  badges: [
    { name: 'React Beginner', icon: 'Award' },
    { name: '5-Day Streak', icon: 'Flame' },
    { name: 'First Project', icon: 'Star' },
    { name: 'Code Contributor', icon: 'GitMerge' },
    { name: 'Feedback Pro', icon: 'MessageSquare' },
    { name: 'Community Helper', icon: 'Users' },
  ],
};


export const leaderboard = [
  { rank: 1, name: 'Elena', xp: 4800, avatar: 'https://placehold.co/40x40.png' },
  { rank: 2, name: 'Ben', xp: 4550, avatar: 'https://placehold.co/40x40.png' },
  { rank: 3, name: 'Carla', xp: 4200, avatar: 'https://placehold.co/40x40.png' },
  { rank: 4, name: 'Alex Doe', xp: 1250, avatar: 'https://placehold.co/40x40.png', isCurrentUser: true },
  { rank: 5, name: 'David', xp: 1100, avatar: 'https://placehold.co/40x40.png' },
  { rank: 6, name: 'Frank', xp: 950, avatar: 'https://placehold.co/40x40.png' },
];

export function getCourse(id: string): Course | undefined {
  return coursesData[id];
}

export function getUser() {
  return user;
}

export function getLeaderboard() {
  return leaderboard;
}
