
import type { CourseCategory } from '@/lib/programming-course';

export type CourseInfo = {
  id: string;
  title: string;
  description: string;
  image: string;
  category?: CourseCategory;
};

export const courses: CourseInfo[] = [
  {
    id: 'masters-codex',
    title: 'Codex Masters Class',
    description:
      'A full Codex apprenticeship: prompt craft, refactoring, tests, debugging, architecture sketches, and shipping features with AI pair programming.',
    image: '/images/masters-codex.png',
    category: 'programming',
  },
  {
    id: 'masters-antigravity',
    title: 'Antigravity Masters Class',
    description:
      'Full Antigravity mastery: agent briefs, workspace context, multi-step missions, review discipline, session systems, and team-ready AI development habits.',
    image: '/images/masters-antigravity.png',
    category: 'programming',
  },
  {
    id: 'masters-claude',
    title: 'Claude Masters Class',
    description:
      'A full Claude apprenticeship: long-context reasoning, structured prompting, research synthesis, writing systems, analysis workflows, and shipping reliable knowledge work end to end.',
    image: '/images/masters-claude.png',
  },
  {
    id: 'masters-perplexity',
    title: 'Perplexity Masters Class',
    description:
      'A full Perplexity apprenticeship: cited research loops, source triage, claim verification, note systems, brief writing, and turning web answers into trustworthy decisions end to end.',
    image: '/images/masters-perplexity.png',
  },
  {
    id: 'masters-figma',
    title: 'Figma Masters Class',
    description:
      'A full Figma apprenticeship: frames, layout systems, components, variants, prototyping, and handoff-ready UI craft from blank canvas to developer-ready specs.',
    image: '/images/masters-figma.png',
  },
  {
    id: 'masters-canva',
    title: 'Canva Masters Class',
    description:
      'A full Canva apprenticeship: brand kits, layout craft, social systems, presentations, campaign kits, and shipping polished marketing visuals end to end without design-tool chaos.',
    image: '/images/masters-canva.png',
  },
  {
    id: 'masters-higgsfield',
    title: 'Higgsfield Masters Class',
    description:
      'A full Higgsfield apprenticeship: motion briefs, prompt craft for AI video, style locking, iteration loops, export discipline, and shipping short-form motion pieces end to end.',
    image: '/images/masters-higgsfield.png',
  },
  {
    id: 'masters-capcut',
    title: 'CapCut Masters Class',
    description:
      'A full CapCut apprenticeship: timeline craft, pacing, captions, sound design, effects discipline, and exporting short-form video that holds attention end to end on social platforms.',
    image: '/images/masters-capcut.png',
  },
  {
    id: 'masters-prompt-engineering',
    title: 'Prompt Engineering Masters Class',
    description:
      'A full prompt-engineering apprenticeship: patterns that transfer across Codex, Claude, Perplexity, and creative AI—specs, evaluation, libraries, failure diagnosis, and team standards end to end.',
    image: '/images/masters-prompt-engineering.png',
  },
  {
    id: 'masters-creative-ai-capstone',
    title: 'Creative AI Capstone Masters',
    description:
      'A full Creative AI Capstone apprenticeship: integrate Claude, Perplexity, Figma/Canva, Higgsfield, and CapCut into one end-to-end campaign—from research brief to shipped multi-asset launch.',
    image: '/images/masters-creative-ai-capstone.png',
  },
  {
    id: 'react-fundamentals',
    title: 'React Development',
    description: 'Learn React from fundamentals to building modern web applications.',
    image: '/images/react-fundamentals.jpg',
    category: 'programming',
  },
  {
    id: 'advanced-css',
    title: 'Advanced CSS',
    description: 'Level up your styling skills with Flexbox, Grid, and Sass.',
    image: '/images/advanced-css.jpg',
    category: 'programming',
  },
  {
    id: 'digital-productivity-mastery',
    title: 'Digital Productivity',
    description: 'Essential Tools for the Modern Workforce. Master Google Workspace, Microsoft Office, Notion, and Canva.',
    image: '/images/digital-productivity-mastery.jpg',
  },
  {
    id: 'Python-SP-101',
    title: 'Python Programming',
    description: 'Build a strong foundation in Python with this beginner-friendly course.',
    image: '/images/1754598826269-python.jpg',
    category: 'programming',
  },
];

/** Masters Class catalog entries (first 10 in `courses`). */
export const mastersCourses = courses.filter((c) => c.id.startsWith('masters-'));
