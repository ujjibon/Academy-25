'use client';
import { useState, useEffect, useRef } from 'react';
import type { Course, Lesson } from '@/lib/data-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SimpleVisual } from '@/components/ui/simple-visual';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Brain,
  Presentation,
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  FileDown,
  Sparkles,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getLessonSlidesFromFirestore,
  saveLessonSlidesToFirestore,
} from '@/lib/lesson-slides-cache';
import type {
  ClassroomSlide,
  ClassroomSlideGeneratorOutput,
} from '@/ai/flows/classroom-slide-generator-flow';
import type { ClassroomExportSlide } from '@/lib/classroom-slides-export-types';
import { downloadClassroomSlidesPdf } from '@/lib/classroom-slides-pdf';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Slide {
  id: string;
  title: string;
  content: string;
  type: 'introduction' | 'concept' | 'example' | 'practice' | 'summary' | 'visual';
  visualType?: ClassroomSlide['visualType'];
  visualDescription?: string;
  keyPoints?: string[];
  visualData?: {
    type: 'chart' | 'diagram' | 'image' | 'video' | 'code' | 'infographic' | string;
    data?: {
      description?: string;
      svgContent?: string;
      mermaidCode?: string;
      cssVisual?: string;
      imageDataUrl?: string;
    };
    url?: string;
  };
  imageDataUrl?: string;
  duration: number;
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
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
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
  const [isExporting, setIsExporting] = useState(false);
  const [isEnhancingVisuals, setIsEnhancingVisuals] = useState(false);
  
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const mapApiSlidesToUi = (result: ClassroomSlideGeneratorOutput): Slide[] =>
    result.slides.map((slide) => {
      const imageDataUrl =
        slide.imageDataUrl ||
        slide.visualData?.data?.imageDataUrl ||
        (slide.visualData?.url?.startsWith('data:') ? slide.visualData.url : undefined);

      return {
        id: slide.id,
        title: slide.title,
        content: slide.content,
        type: slide.type,
        visualType: slide.visualType,
        visualDescription: slide.visualDescription,
        keyPoints: slide.keyPoints,
        imageDataUrl,
        visualData: slide.visualData
          ? {
              type: slide.visualData.type || slide.visualType || 'diagram',
              url: slide.visualData.url || imageDataUrl,
              data: {
                description:
                  slide.visualData.data?.description || slide.visualDescription,
                svgContent: slide.visualData.data?.svgContent,
                mermaidCode: slide.visualData.data?.mermaidCode,
                cssVisual: slide.visualData.data?.cssVisual,
                imageDataUrl:
                  slide.visualData.data?.imageDataUrl || imageDataUrl,
              },
            }
          : {
              type: slide.visualType || 'diagram',
              url: imageDataUrl,
              data: {
                description: slide.visualDescription,
                imageDataUrl,
              },
            },
        duration: slide.duration,
        interactive: slide.interactive,
        notes: slide.keyPoints?.join('\n') ?? '',
      };
    });

  const slidesToExportPayload = (deck: Slide[]): ClassroomExportSlide[] =>
    deck.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      type: s.type,
      keyPoints: s.keyPoints,
      notes: s.notes,
      visualDescription: s.visualDescription,
      visualType: s.visualType,
      imageDataUrl: s.imageDataUrl,
      visualData: s.visualData,
    }));

  const applySlideDeck = (result: ClassroomSlideGeneratorOutput, fromCache: boolean) => {
    const mapped = mapApiSlidesToUi(result);
    setSlides(mapped);
    setLearningObjectives(result.learningObjectives ?? []);
    setClassroomState((prev) => ({ ...prev, totalDuration: result.totalDuration }));
    toast({
      title: fromCache ? 'Classroom loaded' : 'AI Classroom ready',
      description: fromCache
        ? `${mapped.length} saved slides loaded.`
        : `Generated and saved ${mapped.length} slides for this lesson.`,
    });
  };

  const loadSlides = async () => {
    setIsGeneratingSlides(true);
    try {
      const cached = await getLessonSlidesFromFirestore(course.id, lesson.id);
      if (cached?.slides?.length) {
        applySlideDeck(cached, true);
        return;
      }

      const response = await fetch('/api/ai/classroom-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          lesson: {
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            introduction: { text: lesson.introduction.text },
          },
          courseContext: {
            title: course.title,
            description: course.description,
            lessons: course.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              duration: l.duration,
            })),
          },
          learningLevel: 'intermediate',
          visualStyle: 'interactive',
          slideCount: 8,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Slide generation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(`Failed to generate slides: ${response.status} ${response.statusText}`);
      }

      const result = (await response.json()) as ClassroomSlideGeneratorOutput & {
        cached?: boolean;
      };

      await saveLessonSlidesToFirestore(course.id, lesson.id, result);
      applySlideDeck(result, Boolean(result.cached));
    } catch (error) {
      console.error('Error loading slides:', error);
      setSlides(createFallbackSlides());
      toast({
        title: 'Using fallback slides',
        description: 'Could not load or generate slides. Showing basic lesson content.',
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
          data: { description: concept },
        },
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

  useEffect(() => {
    setIsLoading(true);
    loadSlides();
  }, [course.id, lesson.id]);

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

  const exportMeta = {
    courseTitle: course.title,
    lessonTitle: lesson.title,
    learningObjectives,
  };

  const handleDownloadPdf = () => {
    if (!slides.length) return;
    setIsExporting(true);
    try {
      downloadClassroomSlidesPdf(slidesToExportPayload(slides), exportMeta);
      toast({ title: 'PDF downloaded', description: 'Your classroom deck is ready.' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'PDF export failed',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPptx = async () => {
    if (!slides.length) return;
    setIsExporting(true);
    try {
      const { downloadClassroomSlidesPptx } = await import('@/lib/classroom-slides-pptx');
      await downloadClassroomSlidesPptx(slidesToExportPayload(slides), exportMeta);
      toast({ title: 'PowerPoint downloaded', description: 'Your .pptx deck is ready.' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'PowerPoint export failed',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEnhanceVisuals = async () => {
    if (!slides.length || isEnhancingVisuals) return;
    setIsEnhancingVisuals(true);
    let enhancedCount = 0;

    try {
      const next = [...slides];

      for (let i = 0; i < next.length; i++) {
        const slide = next[i];
        const hasImage =
          Boolean(slide.imageDataUrl) ||
          Boolean(slide.visualData?.data?.imageDataUrl);
        const hasSvg =
          Boolean(slide.visualData?.data?.svgContent) ||
          Boolean(slide.visualData?.data?.mermaidCode);
        const prompt =
          slide.visualDescription ||
          slide.visualData?.data?.description ||
          slide.title;

        const wantsImage =
          slide.visualType === 'image' || slide.visualData?.type === 'image';
        const wantsSvg =
          !wantsImage &&
          ['chart', 'diagram', 'infographic'].includes(
            slide.visualType || slide.visualData?.type || ''
          ) &&
          ['concept', 'example', 'visual'].includes(slide.type);

        if (wantsImage && !hasImage && prompt) {
          const res = await fetch('/api/ai/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.imageDataUrl) {
              next[i] = {
                ...slide,
                imageDataUrl: data.imageDataUrl,
                visualData: {
                  type: 'image',
                  url: data.imageDataUrl,
                  data: {
                    ...slide.visualData?.data,
                    description: prompt,
                    imageDataUrl: data.imageDataUrl,
                  },
                },
              };
              enhancedCount++;
            }
          }
        } else if (wantsSvg && !hasSvg && prompt) {
          const visualType =
            slide.visualType === 'chart'
              ? 'chart'
              : slide.visualType === 'infographic'
                ? 'infographic'
                : 'diagram';
          const res = await fetch('/api/ai/generate-simple-visual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: slide.title,
              visualType,
              context: slide.content.slice(0, 800),
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const visual = data.result;
            if (visual) {
              next[i] = {
                ...slide,
                visualDescription: visual.description || slide.visualDescription,
                visualData: {
                  type: slide.visualType || visualType,
                  data: {
                    description: visual.description || prompt,
                    svgContent: visual.svgContent,
                    mermaidCode: visual.mermaidCode,
                    cssVisual: visual.cssVisual,
                  },
                },
              };
              enhancedCount++;
            }
          }
        }
      }

      setSlides(next);

      // Persist enriched visuals when possible (omit large image data URLs for Firestore limits)
      try {
        const payload: ClassroomSlideGeneratorOutput = {
          slides: next.map((s) => ({
            id: s.id,
            title: s.title,
            content: s.content,
            type: s.type,
            visualType: (s.visualType ||
              'diagram') as ClassroomSlide['visualType'],
            duration: s.duration,
            interactive: Boolean(s.interactive),
            keyPoints: s.keyPoints || [],
            examples: [],
            visualDescription: s.visualDescription || '',
            visualData: s.visualData
              ? {
                  type: s.visualData.type,
                  data: {
                    description: s.visualData.data?.description,
                    svgContent: s.visualData.data?.svgContent,
                    mermaidCode: s.visualData.data?.mermaidCode,
                    cssVisual: s.visualData.data?.cssVisual,
                    // Keep image only if short (unlikely); otherwise session-only
                    imageDataUrl:
                      s.visualData.data?.imageDataUrl &&
                      s.visualData.data.imageDataUrl.length < 80_000
                        ? s.visualData.data.imageDataUrl
                        : undefined,
                  },
                }
              : undefined,
          })),
          totalDuration: classroomState.totalDuration,
          learningObjectives,
          visualElements: [],
          interactiveElements: [],
          teachingNotes: '',
        };
        await saveLessonSlidesToFirestore(course.id, lesson.id, payload);
      } catch (persistErr) {
        console.warn('Could not persist enhanced visuals:', persistErr);
      }

      toast({
        title: enhancedCount > 0 ? 'Visuals enhanced' : 'No visuals to enhance',
        description:
          enhancedCount > 0
            ? `Updated ${enhancedCount} slide(s) with AI visuals.`
            : 'Slides already have visuals, or none needed enrichment.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Visual enhancement failed',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingVisuals(false);
    }
  };

  const renderVisualElement = (visualData: Slide['visualData']) => {
    if (!visualData) return null;

    const hasRichVisual =
      visualData.data?.svgContent ||
      visualData.data?.mermaidCode ||
      visualData.data?.cssVisual ||
      visualData.data?.imageDataUrl ||
      (visualData.url &&
        (visualData.url.startsWith('data:') || visualData.url.startsWith('http')));

    if (hasRichVisual) {
      return <SimpleVisual visualData={visualData} />;
    }

    // Fallback to original visual placeholders
    switch (visualData.type) {
      case 'chart':
        return (
          <div className="lesson-accent-panel p-6 rounded-lg">
            <BarChart3 className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Interactive Chart</p>
          </div>
        );
      case 'diagram':
        return (
          <div className="lesson-accent-panel p-6 rounded-lg">
            <PieChart className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Concept Diagram</p>
          </div>
        );
      case 'image':
        return (
          <div className="lesson-accent-panel p-6 rounded-lg">
            <ImageIcon className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Visual Example</p>
          </div>
        );
      case 'video':
        return (
          <div className="lesson-accent-panel p-6 rounded-lg">
            <Video className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Video Content</p>
          </div>
        );
      case 'code':
        return (
          <div className="lesson-accent-panel p-6 rounded-lg">
            <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-center text-foreground">Code Example</p>
          </div>
        );
      case 'infographic':
        return (
          <div className="lesson-accent-panel p-6 rounded-lg">
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
      <Card className="min-h-[280px] sm:min-h-[420px]">
        <CardContent className="flex items-center justify-center py-16 sm:py-24">
          <div className="text-center px-4">
            <Brain className="mx-auto mb-4 h-10 w-10 animate-pulse text-royal sm:h-12 sm:w-12" />
            <h3 className="mb-2 text-base font-semibold text-midnight sm:text-lg">
              Preparing Your Classroom
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {isGeneratingSlides
                ? 'Loading slides (first visit may generate once)...'
                : 'Loading classroom...'}
            </p>
            <Progress value={isGeneratingSlides ? 75 : 25} className="mx-auto w-full max-w-xs" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[min(70vh,640px)] flex-col overflow-hidden rounded-[1rem] border border-royal/15 bg-chalk sm:min-h-[520px] sm:rounded-[1.25rem]',
        classroomState.isFullscreen && 'fixed inset-0 z-50 min-h-screen rounded-none'
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-royal/10 bg-canvas/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
            <Presentation className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-midnight sm:text-lg">
              AI Learning Classroom
            </h2>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {lesson.title} · Slide {classroomState.currentSlide + 1} of {slides.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="h-9 rounded-full border-royal/20 bg-royal/5 px-3 text-royal"
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {Math.floor(classroomState.totalDuration / 60)}m {classroomState.totalDuration % 60}s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-9 rounded-full border-royal/20 px-2.5 text-royal hover:bg-royal/10 sm:px-3"
            onClick={handleEnhanceVisuals}
            disabled={isEnhancingVisuals || isExporting || slides.length === 0}
          >
            {isEnhancingVisuals ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-1.5 hidden sm:inline">
              {isEnhancingVisuals ? 'Enhancing…' : 'Visuals'}
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 min-w-9 rounded-full border-royal/20 px-2.5 text-royal hover:bg-royal/10 sm:px-3"
                disabled={isExporting || slides.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Download</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleDownloadPptx()}>
                <Presentation className="mr-2 h-4 w-4" />
                Download PowerPoint
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEnhanceVisuals} disabled={isEnhancingVisuals}>
                <Sparkles className="mr-2 h-4 w-4" />
                Enhance visuals first
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-9 rounded-full border-royal/20 px-2.5 text-royal hover:bg-royal/10"
            onClick={handleToggleFullscreen}
          >
            {classroomState.isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile slide strip */}
      <div className="border-b border-royal/10 bg-canvas/50 lg:hidden">
        <div className="flex gap-2 overflow-x-auto px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {slides.map((slide, index) => {
            const active = classroomState.currentSlide === index;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSlideClick(index)}
                className={cn(
                  'flex min-w-[7.5rem] max-w-[9.5rem] shrink-0 flex-col gap-1 rounded-xl border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-royal bg-royal text-white shadow-[0_2px_8px_rgb(0_19_158/0.25)]'
                    : 'border-royal/15 bg-chalk text-midnight hover:bg-royal/5'
                )}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  {getSlideTypeIcon(slide.type)}
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="line-clamp-2 text-xs font-medium leading-snug">{slide.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Main Content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {currentSlide && (
              <div className="mx-auto max-w-4xl">
                <div className="mb-5 sm:mb-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal/10 text-royal">
                      {getSlideTypeIcon(currentSlide.type)}
                    </span>
                    <h1 className="text-xl font-bold text-midnight sm:text-2xl">
                      {currentSlide.title}
                    </h1>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-royal/10 text-royal hover:bg-royal/10"
                    >
                      {currentSlide.type}
                    </Badge>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base break-words">
                    <ReactMarkdown>{currentSlide.content}</ReactMarkdown>
                  </div>
                </div>

                {currentSlide.visualData && (
                  <div className="mt-5 sm:mt-6">{renderVisualElement(currentSlide.visualData)}</div>
                )}

                {currentSlide.interactive && (
                  <div className="mt-5 rounded-xl border border-royal/15 bg-royal/5 p-4 sm:mt-6">
                    <h3 className="mb-1 font-semibold text-midnight">Interactive Activity</h3>
                    <p className="text-sm text-muted-foreground">
                      This slide includes interactive elements. Take your time to explore and
                      practice.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="safe-bottom border-t border-royal/10 bg-canvas/80 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full border-royal/20 p-0 text-royal"
                  onClick={handleRestart}
                  disabled={classroomState.currentSlide === 0}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full border-royal/20 p-0 text-royal"
                  onClick={handlePreviousSlide}
                  disabled={classroomState.currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="h-10 min-w-10 rounded-full bg-royal px-4 text-white hover:bg-royal-light"
                  onClick={handlePlayPause}
                >
                  {classroomState.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full border-royal/20 p-0 text-royal"
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
                  className="h-10 w-10 rounded-full p-0 text-royal"
                  onClick={handleToggleMute}
                >
                  {classroomState.isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <div className="hidden text-sm text-muted-foreground sm:block">
                  {currentSlide?.duration || 0}s
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Progress
                value={
                  slides.length
                    ? ((classroomState.currentSlide + 1) / slides.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 border-l border-royal/10 bg-canvas/60 lg:flex lg:flex-col xl:w-80">
          <div className="border-b border-royal/10 p-4">
            <h3 className="font-semibold text-midnight">Slide Navigation</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{slides.length} slides</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2 p-3">
              {slides.map((slide, index) => {
                const active = classroomState.currentSlide === index;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => handleSlideClick(index)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-colors',
                      active
                        ? 'border-royal bg-royal text-white shadow-[0_2px_8px_rgb(0_19_158/0.2)]'
                        : 'border-royal/10 bg-chalk text-midnight hover:bg-royal/5'
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {getSlideTypeIcon(slide.type)}
                      <span className="line-clamp-2 text-sm font-medium">{slide.title}</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center justify-between text-xs',
                        active ? 'text-white/75' : 'text-muted-foreground'
                      )}
                    >
                      <span className="capitalize">{slide.type}</span>
                      <span>{slide.duration}s</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

