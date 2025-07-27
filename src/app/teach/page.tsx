'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateMicroCourse, type GenerateMicroCourseOutput } from '@/ai/flows/generate-micro-course';
import { Loader2, PenSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Separator } from '@/components/ui/separator';

export default function TeachPage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [courseContent, setCourseContent] = useState<GenerateMicroCourseOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateCourse = async () => {
    if (!topic.trim()) {
      toast({ title: 'Topic is required', description: 'Please enter a topic you want to teach.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setCourseContent(null);
    try {
      const result = await generateMicroCourse({ topic });
      setCourseContent(result);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not generate the course content. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenSquare className="h-6 w-6" />
              AI-Assisted Course Creator
            </CardTitle>
            <CardDescription>
              Solidify your knowledge by teaching others. Enter a topic you've mastered, and our AI will help you structure a micro-course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="topic">What do you want to teach?</Label>
              <div className="flex gap-2">
                <Input
                  id="topic"
                  placeholder="e.g., React Components, CSS Flexbox, or Pivot Tables"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isLoading}
                />
                <Button onClick={handleGenerateCourse} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {courseContent && (
          <Card>
            <CardHeader>
              <CardTitle>{courseContent.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Introduction</h3>
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{courseContent.introduction}</ReactMarkdown>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Concepts</h3>
                <ul className="space-y-4">
                  {courseContent.keyConcepts.map((concept, index) => (
                    <li key={index}>
                      <h4 className="font-semibold">{concept.concept}</h4>
                      <p className="text-muted-foreground">{concept.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Hands-On Challenge</h3>
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">{courseContent.challenge.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{courseContent.challenge.description}</p>
                    </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter>
                <Button>Save & Publish Course (Coming Soon)</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
