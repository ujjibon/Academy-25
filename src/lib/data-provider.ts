
import { courses as courseList } from './courses';
import advancedCss from '@/data/courses/advanced-css.json';
import digitalProductivity from '@/data/courses/digital-productivity-mastery.json';
import reactFundamentals from '@/data/courses/react-fundamentals.json';
import pythonSP101 from '@/data/courses/Python-SP-101.json';
import mastersCodex from '@/data/courses/masters-codex.json';
import mastersAntigravity from '@/data/courses/masters-antigravity.json';
import mastersClaude from '@/data/courses/masters-claude.json';
import mastersPerplexity from '@/data/courses/masters-perplexity.json';
import mastersFigma from '@/data/courses/masters-figma.json';
import mastersCanva from '@/data/courses/masters-canva.json';
import mastersHiggsfield from '@/data/courses/masters-higgsfield.json';
import mastersCapcut from '@/data/courses/masters-capcut.json';
import mastersPromptEngineering from '@/data/courses/masters-prompt-engineering.json';
import mastersCreativeAiCapstone from '@/data/courses/masters-creative-ai-capstone.json';

export type CourseCategory = 'general' | 'programming';

export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'jsx'
  | 'tsx'
  | 'python'
  | 'html'
  | 'css'
  | 'java'
  | 'cpp';

export type Course = {
  id: string;
  title: string;
  description: string;
  image: string;
  /** When `programming`, lessons use the code editor for project submissions. */
  category?: CourseCategory;
  lessons: Lesson[];
};

export type LearningActivity = {
  id: string;
  title: string;
  description: string;
};

export type Lesson = {
  id: string;
  title: string;
  duration: number; // in minutes
  introduction: {
    text: string;
  };
  /** Optional learning goals shown as interactive checklist. */
  objectives?: string[];
  /** Optional hands-on steps for the project phase. */
  activities?: LearningActivity[];
  /** Optional takeaways revealed after the learn phase. */
  keyTakeaways?: string[];
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
  /** Code editor settings for programming courses. */
  code?: {
    language: CodeLanguage;
    starterCode?: string;
    enablePreview?: boolean;
    enableConsole?: boolean;
  };
};

// This is a map of the course IDs to the imported JSON data.
// In a real application, you would fetch this from a database.
const coursesData: { [key: string]: Course } = {
  'masters-codex': mastersCodex as Course,
  'masters-antigravity': mastersAntigravity as Course,
  'masters-claude': mastersClaude as Course,
  'masters-perplexity': mastersPerplexity as Course,
  'masters-figma': mastersFigma as Course,
  'masters-canva': mastersCanva as Course,
  'masters-higgsfield': mastersHiggsfield as Course,
  'masters-capcut': mastersCapcut as Course,
  'masters-prompt-engineering': mastersPromptEngineering as Course,
  'masters-creative-ai-capstone': mastersCreativeAiCapstone as Course,
  'react-fundamentals': reactFundamentals as Course,
  'advanced-css': advancedCss as Course,
  'digital-productivity-mastery': digitalProductivity as Course,
  'Python-SP-101': pythonSP101 as Course,
};


export const user = {
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  avatar: 'https://placehold.co/100x100.png',
  xp: 1250,
  level: 8,
  dailyStreak: 5,
  weeklyProgress: 60,
  activeCourseId: 'masters-codex',
  activeLessonId: '1',
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
