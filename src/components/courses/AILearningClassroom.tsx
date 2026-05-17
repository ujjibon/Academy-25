'use client';
import { useState, useEffect, useRef } from 'react';
import type { Course, Lesson } from '@/lib/data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SimpleVisual } from '@/components/ui/simple-visual';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  BookOpen,
  Lightbulb,
  Target,
  CheckCircle2,
  Clock,
  Users,
  Brain,
  Presentation,
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  Share2,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Removed direct import - using API route instead
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Slide {
  id: string;
  title: string;
  content: string;
  type: 'introduction' | 'concept' | 'example' | 'practice' | 'summary' | 'visual';
  visualData?: {
    type: 'chart' | 'diagram' | 'image' | 'video' | 'code' | 'infographic';
    data?: any;
    url?: string;
  };
  duration: number; // in seconds
  interactive?: boolean;
  notes?: string;
}

interface ClassroomState {
  currentSlide: number;
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  progress: number;
  totalDuration: number;
  completedSlides: string[];
  notes: string;
  isTakingNotes: boolean;
}

export function AILearningClassroom({ course, lesson }: { course: Course; lesson: Lesson }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [classroomState, setClassroomState] = useState<ClassroomState>({
    currentSlide: 0,
    isPlaying: false,
    isMuted: false,
    isFullscreen: false,
    progress: 0,
    totalDuration: 0,
    completedSlides: [],
    notes: '',
    isTakingNotes: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Generate slides from lesson content
  const generateSlides = async () => {
    setIsGeneratingSlides(true);
    try {
      const response = await fetch('/api/ai/classroom-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson: {
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            introduction: { text: lesson.introduction.text }
          },
          courseContext: {
            title: course.title,
            description: course.description,
            lessons: course.lessons.map(l => ({ id: l.id, title: l.title, duration: l.duration }))
          },
          learningLevel: 'intermediate',
          visualStyle: 'interactive',
          slideCount: 8
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Slide generation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to generate slides: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Convert the generated slides to our Slide interface
      const generatedSlides: Slide[] = result.slides.map((slide: any) => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
        type: slide.type,
        visualData: {
          type: slide.visualType || slide.visualData?.type || 'diagram',
          data: slide.visualData?.data || { description: slide.visualDescription }
        },
        duration: slide.duration,
        interactive: slide.interactive,
        notes: slide.keyPoints.join('\n')
      }));

      setSlides(generatedSlides);
      setClassroomState(prev => ({ ...prev, totalDuration: result.totalDuration }));
      
      toast({
        title: 'AI Classroom Ready!',
        description: `Generated ${generatedSlides.length} interactive slides with visual elements.`,
      });
    } catch (error) {
      console.error('Error generating slides:', error);
      // Fallback slides
      const fallbackSlides = createFallbackSlides();
      setSlides(fallbackSlides);
      toast({
        title: 'Using Fallback Slides',
        description: 'AI generation failed, using basic lesson slides.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSlides(false);
      setIsLoading(false);
    }
  };

  // Parse AI content into structured slides
  const parseContentToSlides = (content: string, keyConcepts: string[], examples: string[]): Slide[] => {
    const slides: Slide[] = [];
    
    // Introduction slide
    slides.push({
      id: 'intro',
      title: `Welcome to ${lesson.title}`,
      content: `# ${lesson.title}\n\n${lesson.introduction.text}\n\n## Learning Objectives\n${keyConcepts.map(concept => `- ${concept}`).join('\n')}`,
      type: 'introduction',
      duration: 30,
      visualData: {
        type: 'image',
        url: '/images/classroom-intro.jpg'
      }
    });

    // Concept slides
    keyConcepts.forEach((concept, index) => {
      slides.push({
        id: `concept-${index}`,
        title: concept,
        content: `## ${concept}\n\nDetailed explanation of this concept with examples and applications.`,
        type: 'concept',
        duration: 45,
        visualData: {
          type: 'diagram',
          data: { concept, level: 'intermediate' }
        }
      });
    });

    // Example slides
    examples.forEach((example, index) => {
      slides.push({
        id: `example-${index}`,
        title: `Example: ${example.split('.')[0]}`,
        content: `## Practical Example\n\n${example}\n\n### Key Takeaways\n- This demonstrates the concept in action\n- Notice how it applies to real-world scenarios`,
        type: 'example',
        duration: 60,
        interactive: true
      });
    });

    // Practice slide
    slides.push({
      id: 'practice',
      title: 'Practice Time',
      content: '## Let\'s Practice Together\n\nNow it\'s your turn to apply what you\'ve learned. Try these exercises:',
      type: 'practice',
      duration: 90,
      interactive: true
    });

    // Summary slide
    slides.push({
      id: 'summary',
      title: 'Lesson Summary',
      content: `## What We've Learned\n\n${keyConcepts.map(concept => `- ${concept}`).join('\n')}\n\n## Next Steps\n- Review the key concepts\n- Practice with the exercises\n- Move to the next lesson`,
      type: 'summary',
      duration: 30
    });

    return slides;
  };

  // Create fallback slides when AI generation fails
  const createFallbackSlides = (): Slide[] => {
    return [
      {
        id: 'intro',
        title: lesson.title,
        content: `# ${lesson.title}\n\n${lesson.introduction.text}`,
        type: 'introduction',
        duration: 30
      },
      {
        id: 'content',
        title: 'Lesson Content',
        content: lesson.introduction.text,
        type: 'concept',
        duration: 60
      },
      {
        id: 'summary',
        title: 'Summary',
        content: '## Key Points\n\n- Review the lesson content\n- Practice the concepts\n- Ask questions if needed',
        type: 'summary',
        duration: 30
      }
    ];
  };

  // Auto-play functionality
  useEffect(() => {
    if (classroomState.isPlaying && slides.length > 0) {
      slideIntervalRef.current = setInterval(() => {
        setClassroomState(prev => {
          const nextSlide = prev.currentSlide + 1;
          if (nextSlide >= slides.length) {
            // End of presentation
            return { ...prev, isPlaying: false, currentSlide: 0 };
          }
          return { ...prev, currentSlide: nextSlide };
        });
      }, slides[classroomState.currentSlide]?.duration * 1000 || 30000);
    } else {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
        slideIntervalRef.current = null;
      }
    }

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [classroomState.isPlaying, classroomState.currentSlide, slides]);

  // Initialize slides on component mount
  useEffect(() => {
    generateSlides();
  }, [lesson.id]);

  const currentSlide = slides[classroomState.currentSlide];

  const handlePlayPause = () => {
    setClassroomState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handlePreviousSlide = () => {
    setClassroomState(prev => ({
      ...prev,
      currentSlide: Math.max(0, prev.currentSlide - 1)
    }));
  };

  const handleNextSlide = () => {
    setClassroomState(prev => ({
      ...prev,
      currentSlide: Math.min(slides.length - 1, prev.currentSlide + 1)
    }));
  };

  const handleSlideClick = (index: number) => {
    setClassroomState(prev => ({ ...prev, currentSlide: index }));
  };

  const handleToggleMute = () => {
    setClassroomState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleToggleFullscreen = () => {
    setClassroomState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  };

  const handleRestart = () => {
    setClassroomState(prev => ({
      ...prev,
      currentSlide: 0,
      isPlaying: false,
      progress: 0
    }));
  };

  const renderVisualElement = (visualData: Slide['visualData']) => {
    if (!visualData) return null;

    // Use SimpleVisual component for enhanced visuals
    if (visualData.data && (visualData.data.svgContent || visualData.data.mermaidCode || visualData.data.cssVisual)) {
      return <SimpleVisual visualData={visualData} />;
    }

    // Fallback to original visual placeholders
    switch (visualData.type) {
      case 'chart':
        return (
          <div className="bg-gradient-to-br from-secondary to-background-elevated p-6 rounded-lg">
            <BarChart3 className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Interactive Chart</p>
          </div>
        );
      case 'diagram':
        return (
          <div className="bg-gradient-to-br from-secondary to-background-elevated p-6 rounded-lg">
            <PieChart className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Concept Diagram</p>
          </div>
        );
      case 'image':
        return (
          <div className="bg-gradient-to-br from-secondary to-background-elevated p-6 rounded-lg">
            <ImageIcon className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Visual Example</p>
          </div>
        );
      case 'video':
        return (
          <div className="bg-gradient-to-br from-secondary to-background-elevated p-6 rounded-lg">
            <Video className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Video Content</p>
          </div>
        );
      case 'code':
        return (
          <div className="bg-gradient-to-br from-secondary to-background-elevated p-6 rounded-lg">
            <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Code Example</p>
          </div>
        );
      case 'infographic':
        return (
          <div className="bg-gradient-to-br from-secondary to-background-elevated p-6 rounded-lg">
            <TrendingUp className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Infographic</p>
          </div>
        );
      default:
        return null;
    }
  };

  const getSlideTypeIcon = (type: Slide['type']) => {
    switch (type) {
      case 'introduction': return <BookOpen className="h-4 w-4" />;
      case 'concept': return <Brain className="h-4 w-4" />;
      case 'example': return <Lightbulb className="h-4 w-4" />;
      case 'practice': return <Target className="h-4 w-4" />;
      case 'summary': return <CheckCircle2 className="h-4 w-4" />;
      case 'visual': return <Presentation className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading || isGeneratingSlides) {
    return (
      <Card className="h-[80vh]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Preparing Your Classroom</h3>
            <p className="text-muted-foreground mb-4">
              {isGeneratingSlides ? 'Generating interactive slides...' : 'Loading classroom...'}
            </p>
            <Progress value={isGeneratingSlides ? 75 : 25} className="w-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-[80vh] border rounded-lg bg-white dark:bg-gray-900",
      classroomState.isFullscreen && "fixed inset-0 z-50 h-screen"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-secondary to-background-elevated">
        <div className="flex items-center gap-4">
          <Presentation className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-semibold text-lg">AI Learning Classroom</h2>
            <p className="text-sm text-muted-foreground">
              {lesson.title} • Slide {classroomState.currentSlide + 1} of {slides.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.floor(classroomState.totalDuration / 60)}m {classroomState.totalDuration % 60}s
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFullscreen}
          >
            {classroomState.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Slide Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentSlide && (
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    {getSlideTypeIcon(currentSlide.type)}
                    <h1 className="text-2xl font-bold">{currentSlide.title}</h1>
                    <Badge variant="secondary">{currentSlide.type}</Badge>
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{currentSlide.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Visual Element */}
                {currentSlide.visualData && (
                  <div className="mt-6">
                    {renderVisualElement(currentSlide.visualData)}
                  </div>
                )}

                {/* Interactive Elements */}
                {currentSlide.interactive && (
                  <div className="mt-6 p-4 bg-secondary/60 rounded-lg border border-border">
                    <h3 className="font-semibold text-foreground mb-2">
                      Interactive Activity
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      This slide includes interactive elements. Take your time to explore and practice.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="border-t p-4 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestart}
                  disabled={classroomState.currentSlide === 0}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousSlide}
                  disabled={classroomState.currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePlayPause}
                >
                  {classroomState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextSlide}
                  disabled={classroomState.currentSlide === slides.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleMute}
                >
                  {classroomState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {currentSlide?.duration || 0}s
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <Progress 
                value={(classroomState.currentSlide / slides.length) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Sidebar - Slide Navigation */}
        <div className="w-80 border-l bg-secondary/50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Slide Navigation</h3>
          </div>
          
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    classroomState.currentSlide === index
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  )}
                  onClick={() => handleSlideClick(index)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getSlideTypeIcon(slide.type)}
                    <span className="font-medium text-sm">{slide.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{slide.type}</span>
                    <span>{slide.duration}s</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

