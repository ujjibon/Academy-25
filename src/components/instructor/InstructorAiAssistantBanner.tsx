'use client';

import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatbot } from '@/hooks/use-chatbot';

export function InstructorAiAssistantBanner() {
  const { open } = useChatbot();

  return (
    <section className="dashboard-panel border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2 max-w-2xl">
        <div className="flex items-center gap-2 text-primary text-sm font-medium">
          <Bot className="h-4 w-4" />
          AI teaching assistant
          <span className="badge-flare py-0 text-[0.65rem]">
            <span className="dot-flare scale-75" aria-hidden />
            Live
          </span>
        </div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Plan lessons, assignments, and feedback with AI
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Get help drafting classwork, rubrics, course outlines, bootcamp weeks, and responses to
          student questions — without leaving your dashboard.
        </p>
      </div>
      <Button onClick={open} className="brand-button shrink-0 gap-2">
        <Sparkles className="h-4 w-4" />
        Open AI assistant
      </Button>
    </section>
  );
}
