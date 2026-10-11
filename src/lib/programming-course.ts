import type {
  Course,
  Project,
  CourseCategory,
  CodeLanguage,
} from '@/lib/data-provider';

export type { CourseCategory, CodeLanguage };

export type CodeProjectConfig = {
  language: CodeLanguage;
  starterCode?: string;
  enablePreview?: boolean;
  enableConsole?: boolean;
};

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JSX (React)',
  tsx: 'TSX (React)',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
  java: 'Java',
  cpp: 'C++',
};

export const PROGRAMMING_COURSE_IDS = new Set([
  'react-fundamentals',
  'Python-SP-101',
  'advanced-css',
  'masters-codex',
  'masters-antigravity',
]);

const DEFAULT_STARTER: Partial<Record<CodeLanguage, string>> = {
  javascript: '// Write your solution here\n\n',
  typescript: '// Write your solution here\n\n',
  jsx: '// Write your JSX here\nconst element = <h1>Hello, World!</h1>;\n',
  tsx: '// Write your TSX here\n',
  python: '# Write your solution here\n\n',
  html: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <!-- Your HTML here -->\n  </body>\n</html>\n',
  css: '/* Write your styles here */\n\n',
  java: '// Write your solution here\npublic class Main {\n  public static void main(String[] args) {\n    \n  }\n}\n',
  cpp: '// Write your solution here\n#include <iostream>\n\nint main() {\n  \n  return 0;\n}\n',
};

export function isProgrammingCourse(course: Pick<Course, 'id' | 'category'>): boolean {
  if (course.category === 'programming') return true;
  return PROGRAMMING_COURSE_IDS.has(course.id);
}

export function getProjectCodeConfig(
  course: Pick<Course, 'id' | 'category'>,
  project: Project
): CodeProjectConfig | null {
  if (!isProgrammingCourse(course)) return null;
  const lang = project.code?.language ?? inferLanguageFromCourse(course.id);
  return {
    language: lang,
    starterCode: project.code?.starterCode ?? DEFAULT_STARTER[lang] ?? '',
    enablePreview: project.code?.enablePreview ?? ['html', 'jsx', 'javascript', 'css'].includes(lang),
    enableConsole: project.code?.enableConsole ?? ['javascript', 'python', 'jsx'].includes(lang),
  };
}

function inferLanguageFromCourse(courseId: string): CodeLanguage {
  if (courseId === 'Python-SP-101') return 'python';
  if (courseId === 'advanced-css') return 'css';
  if (courseId === 'react-fundamentals') return 'jsx';
  return 'javascript';
}

export function defaultStarterForLanguage(language: CodeLanguage): string {
  return DEFAULT_STARTER[language] ?? '// Write your solution here\n\n';
}
