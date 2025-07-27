import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-learning-plan.ts';
import '@/ai/flows/evaluate-submitted-task.ts';
import '@/ai/flows/provide-smart-feedback.ts';
import '@/ai/flows/translate-content.ts';
import '@/ai/flows/provide-practice-hint.ts';
import '@/ai/flows/chat-flow.ts';
import '@/ai/flows/generate-dashboard-suggestion.ts';
import '@/ai/flows/course-tutor-flow.ts';
import '@/ai/flows/generate-micro-course.ts';
import '@/ai/flows/generate-course-flow.ts';
import '@/ai/flows/course-creator-agent-flow.ts';
