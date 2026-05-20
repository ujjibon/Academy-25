'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateCourse } from '@/ai/flows/generate-course-flow';
import { createClassroomCourse } from '@/lib/classroom-service';
import type { Course } from '@/lib/data-provider';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PenSquare, Sparkles, Save } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { groupLessonsIntoModules } from '@/lib/classroom-types';

export function TeachModeContent() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generated, setGenerated] = useState<Course | null>(null);
  const [roadmap, setRoadmap] = useState('');
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Topic required', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setGenerated(null);
    try {
      const result = await generateCourse({ topic: topic.trim() });
      setGenerated(result as Course);
      const modules = groupLessonsIntoModules(result.lessons);
      setRoadmap(
        modules
          .map((m, i) => `Week ${i + 1}: ${m.title} — ${m.lessonIds.length} lessons`)
          .join('\n')
      );
    } catch (error) {
      console.error(error);
      toast({ title: 'Generation failed', description: 'Try a shorter or clearer topic.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generated || !user) return;
    setIsSaving(true);
    try {
      const course = await createClassroomCourse({
        title: generated.title,
        description: generated.description,
        coverImage: generated.image.startsWith('/') ? generated.image : '/images/react-fundamentals.jpg',
        instructorId: user.uid,
        instructorName: userProfile?.displayName || 'Instructor',
        contentCourseId: generated.id,
        courseContent: generated,
      });
      toast({ title: 'Course saved!', description: `Class code: ${course.classCode}` });
      router.push(`/classroom/${course.id}/stream`);
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenSquare className="h-6 w-6" />
            Teach Mode
          </CardTitle>
          <CardDescription>
            Enter any topic — AI builds a full course with modules, lessons, quizzes, projects, and a weekly plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="topic">What should we teach?</Label>
            <TopicInput
              topic={topic}
              setTopic={setTopic}
              isLoading={isLoading}
              onGenerate={handleGenerate}
            />
          </div>
        </CardContent>
      </Card>

      {generated && (
        <Card className="brand-card">
          <CardHeader>
            <CardTitle>{generated.title}</CardTitle>
            <CardDescription>{generated.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roadmap && (
              <Section title="Weekly study plan">
                <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  {roadmap}
                </pre>
              </Section>
            )}
            <Section
              title={`${generated.lessons.length} lessons in ${groupLessonsIntoModules(generated.lessons).length} modules`}
            >
              <Accordion type="single" collapsible>
                {groupLessonsIntoModules(generated.lessons).map((mod) => (
                  <AccordionItem key={mod.id} value={mod.id}>
                    <AccordionTrigger>{mod.title}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {mod.lessonIds.map((lid) => {
                          const lesson = generated.lessons.find((l) => l.id === lid);
                          return lesson ? <li key={lid}>{lesson.title}</li> : null;
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Section>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={isSaving} className="brand-button w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Publish to classroom
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function TopicInput({
  topic,
  setTopic,
  isLoading,
  onGenerate,
}: {
  topic: string;
  setTopic: (v: string) => void;
  isLoading: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Input
        id="topic"
        placeholder='e.g. "Teach me Python for Data Analysis"'
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        disabled={isLoading}
        onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
      />
      <Button onClick={onGenerate} disabled={isLoading} className="brand-button shrink-0">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Generate
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
