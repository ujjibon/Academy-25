'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  BrainCircuit,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { generateDashboardSuggestion } from '@/ai/flows/generate-dashboard-suggestion';
import { useToast } from '@/hooks/use-toast';
import { getUser, getCourse } from '@/lib/data-provider';
import ReactMarkdown from 'react-markdown';

export function PersonalTrainer() {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const user = getUser();

  const fetchSuggestion = async () => {
    setIsLoading(true);
    try {
      const activeCourse = getCourse(user.activeCourseId);
      const result = await generateDashboardSuggestion({
        activeCourse: activeCourse?.title || 'None',
        strengths: user.strengths.map(s => s.name),
        weaknesses: user.weaknesses.map(w => w.name),
      });
      setSuggestion(result.suggestion);
    } catch (error) {
      console.error(error);
      setSuggestion("I couldn't generate a tip right now. Maybe try again?");
      toast({
        title: 'Error',
        description: 'Could not generate a suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>AI Personal Coach</CardTitle>
        <CardDescription>Your daily dose of personalized guidance.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center text-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
             <Loader2 className="h-8 w-8 animate-spin" />
             <p>Thinking of a suggestion...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <BrainCircuit className="h-10 w-10 text-primary" />
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown>{suggestion}</ReactMarkdown>
              </div>
          </div>
        )}
      </CardContent>
       <CardFooter>
        <Button onClick={fetchSuggestion} disabled={isLoading} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Get another suggestion
        </Button>
      </CardFooter>
    </Card>
  );
}
