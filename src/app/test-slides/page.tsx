'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleVisual } from '@/components/ui/simple-visual';
import { useToast } from '@/hooks/use-toast';

export default function TestSlidesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testSlideGeneration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/classroom-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson: {
            id: 'test-lesson',
            title: 'Introduction to React Components',
            duration: 30,
            introduction: { 
              text: 'Learn the fundamentals of React components, including functional components, props, and state management.' 
            }
          },
          courseContext: {
            title: 'React Fundamentals',
            description: 'A comprehensive course on React development',
            lessons: [
              { id: '1', title: 'Introduction to React', duration: 30 },
              { id: '2', title: 'Components and Props', duration: 45 },
              { id: '3', title: 'State Management', duration: 60 }
            ]
          },
          learningLevel: 'intermediate',
          visualStyle: 'interactive',
          slideCount: 5
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate slides');
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: 'Success!',
        description: `Generated ${data.slides?.length || 0} slides successfully.`,
      });
    } catch (error) {
      console.error('Error testing slide generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate slides. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSimpleVisual = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate-simple-visual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'React Component Lifecycle',
          visualType: 'diagram',
          context: 'Show the different phases of a React component lifecycle'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate visual');
      }

      const data = await response.json();
      setResult({ visual: data.result });
      
      toast({
        title: 'Success!',
        description: 'Generated simple visual successfully.',
      });
    } catch (error) {
      console.error('Error testing visual generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate visual. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testGenkit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-genkit');

      if (!response.ok) {
        throw new Error('Failed to test Genkit');
      }

      const data = await response.json();
      setResult({ genkit: data });
      
      toast({
        title: data.success ? 'Success!' : 'Error',
        description: data.success ? 'Genkit is working correctly.' : 'Genkit test failed.',
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error testing Genkit:', error);
      toast({
        title: 'Error',
        description: 'Failed to test Genkit. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test Slide Generation</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testSlideGeneration} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Classroom Slide Generation'}
            </Button>
            
            <Button 
              onClick={testSimpleVisual} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Simple Visual Generation'}
            </Button>
            
            <Button 
              onClick={testGenkit} 
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Genkit Configuration'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result.slides && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Generated Slides ({result.slides.length})</h3>
                  {result.slides.map((slide: any, index: number) => (
                    <div key={slide.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{slide.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{slide.type}</p>
                      <p className="text-sm">{slide.content.substring(0, 200)}...</p>
                      {slide.visualData && (
                        <div className="mt-3">
                          <SimpleVisual visualData={slide.visualData} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {result.visual && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Generated Visual</h3>
                  <SimpleVisual visualData={result.visual} />
                </div>
              )}
              
              {result.genkit && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Genkit Test Results</h3>
                  <div className={`p-4 rounded-lg ${result.genkit.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`font-medium ${result.genkit.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.genkit.success ? '✅ Genkit is working correctly' : '❌ Genkit test failed'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      API Key configured: {result.genkit.hasApiKey ? 'Yes' : 'No'}
                      {result.genkit.apiKeyLength && ` (${result.genkit.apiKeyLength} characters)`}
                    </p>
                    {result.genkit.response && (
                      <p className="text-sm text-gray-700 mt-2">
                        Response: {result.genkit.response}
                      </p>
                    )}
                    {result.genkit.error && (
                      <p className="text-sm text-red-600 mt-2">
                        Error: {result.genkit.error}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Raw JSON Response</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
