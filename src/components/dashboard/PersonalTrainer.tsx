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
import { getCourse } from '@/lib/data-provider';
import { UserProfile } from '@/lib/firebase';
import ReactMarkdown from 'react-markdown';

interface PersonalTrainerProps {
  userProfile: UserProfile;
}

export function PersonalTrainer({ userProfile }: PersonalTrainerProps) {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuggestion = async () => {
    setIsLoading(true);
    try {
      const activeCourse = getCourse(userProfile.activeCourseId || '');
      const result = await generateDashboardSuggestion({
        activeCourse: activeCourse?.title || 'None',
        strengths: userProfile.strengths.map(s => s.name),
        weaknesses: userProfile.weaknesses.map(w => w.name),
      });
      setSuggestion(result.suggestion);
    } catch (error) {
      console.error(error);
      // Fallback suggestions when AI is not available
      const fallbackSuggestions = [
        "Keep up the great work! Consistency is key to mastering new skills.",
        "You're making excellent progress! Consider reviewing previous lessons to reinforce your learning.",
        "Great job on your learning journey! Try to practice what you've learned today.",
        "You're doing amazing! Remember to take breaks and stay hydrated while learning.",
        "Excellent work! Consider sharing what you've learned with others to deepen your understanding."
      ];
      const randomSuggestion = fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];
      setSuggestion(randomSuggestion);
      toast({
        title: 'AI Service Unavailable',
        description: 'Using fallback suggestions. AI features will work once API keys are configured.',
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, [userProfile.activeCourseId, userProfile.strengths, userProfile.weaknesses]);

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
