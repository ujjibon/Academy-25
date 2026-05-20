'use client';
import { useState, useRef, useEffect } from 'react';
import type { Course, Lesson } from '@/lib/data-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Loader2, Send, User, Paperclip, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Removed direct imports - using API routes instead
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export function CourseTutor({ course, currentLesson }: { course: Course; currentLesson?: Lesson }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load chat history from localStorage when the component mounts
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(`chatHistory_${course.id}`);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
      // If parsing fails, clear the corrupted history
      localStorage.removeItem(`chatHistory_${course.id}`);
    }
  }, [course.id]);

  // Auto-start teaching when lesson changes
  useEffect(() => {
    if (currentLesson && !hasAutoStarted && messages.length === 0) {
      startAutoTeaching();
    }
  }, [currentLesson, hasAutoStarted, messages.length]);

  // Listen for custom events from lesson content buttons
  useEffect(() => {
    const handleAITutorMessage = (event: CustomEvent) => {
      const message = event.detail.message;
      if (message) {
        setInput(message);
        // Automatically send the message
        setTimeout(() => {
          sendMessage(message);
        }, 100);
      }
    };

    window.addEventListener('ai-tutor-message', handleAITutorMessage as EventListener);
    
    return () => {
      window.removeEventListener('ai-tutor-message', handleAITutorMessage as EventListener);
    };
  }, []);

  const startAutoTeaching = async () => {
    if (!currentLesson) return;
    
    setHasAutoStarted(true);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/auto-lesson-teaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson: {
            id: currentLesson.id,
            title: currentLesson.title,
            duration: currentLesson.duration,
            introduction: {
              text: currentLesson.introduction.text,
            }
          },
          courseContext: {
            title: course.title,
            description: course.description,
            lessons: course.lessons.map((l: any) => ({id: l.id, title: l.title, duration: l.duration})),
          },
          studentLevel: 'intermediate', // Could be made dynamic based on user profile
          teachingMode: 'introduction',
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const detail =
          typeof errBody?.error === 'string' ? errBody.error : 'Failed to generate auto teaching';
        throw new Error(detail);
      }

      const teachingResult = await response.json();

      // Format the automatic teaching response
      const autoTeachingMessage = `# ${teachingResult.welcomeMessage}

## Learning Objectives:
${teachingResult.learningObjectives.map((obj: any) => `- ${obj}`).join('\n')}

## What You'll Learn:
${teachingResult.teachingContent}

## Key Concepts:
${teachingResult.keyConcepts.map((concept: any) => `- ${concept}`).join('\n')}

## Practical Examples:
${teachingResult.practicalExamples.map((example: any) => `- ${example}`).join('\n')}

## Interactive Questions:
${teachingResult.interactiveQuestions.map((question: any) => `- ${question}`).join('\n')}

## Next Steps:
${teachingResult.nextSteps.map((step: any) => `- ${step}`).join('\n')}

**Estimated Time:** ${teachingResult.estimatedTime}

---

*I'm here to help you learn! Feel free to ask me any questions about this lesson or request more detailed explanations.*`;

      const modelMessage: Message = { role: 'model', text: autoTeachingMessage };
      setMessages([modelMessage]);
      
      // Save to localStorage
      localStorage.setItem(`chatHistory_${course.id}`, JSON.stringify([modelMessage]));
      
      toast({
        title: 'AI Teacher Started',
        description: 'Your AI teacher has automatically begun teaching this lesson!',
      });
    } catch (error) {
      console.error('Auto teaching error:', error);
      // Fallback welcome message
      const fallbackMessage = `# Welcome to "${currentLesson.title}"!

I'm your AI teacher for this lesson. I'll guide you through learning about ${currentLesson.title} with comprehensive explanations, practical examples, and interactive support.

## What we'll cover:
${currentLesson.introduction.text}

## Ready to learn?
Feel free to ask me any questions, request detailed explanations, or ask for practical examples. I'm here to help you master this topic!

**Lesson Duration:** ${currentLesson.duration} minutes`;

      const modelMessage: Message = { role: 'model', text: fallbackMessage };
      setMessages([modelMessage]);
      
      toast({
        title: 'AI Teacher Ready',
        description: 'Your AI teacher is ready to help you learn!',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chatHistory_${course.id}`, JSON.stringify(messages));
    }
  }, [messages, course.id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFileDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileDataUri(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const isComprehensiveTeachingRequest = (question: string): boolean => {
    const comprehensiveKeywords = [
      'explain step by step',
      'teach me',
      'comprehensive explanation',
      'complete guide',
      'everything about',
      'full explanation',
      'detailed explanation',
      'step by step guide'
    ];
    return comprehensiveKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() && !file) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({ // Use the existing messages state for history
        user: msg.role === 'user' ? msg.text : '',
        model: msg.role === 'model' ? msg.text : '',
      }));
      
      let result;
      
      // Use quick teaching for most requests (faster)
      if (currentLesson && (isComprehensiveTeachingRequest(textToSend) || textToSend.length > 20)) {
        const response = await fetch('/api/ai/quick-teaching', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: currentLesson.title,
            currentLesson: {
              id: currentLesson.id,
              title: currentLesson.title,
              duration: currentLesson.duration,
              introduction: {
                text: currentLesson.introduction.text,
              }
            },
            courseContext: {
              title: course.title,
              description: course.description,
              lessons: course.lessons.map((l: any) => ({id: l.id, title: l.title, duration: l.duration})),
            },
            learningLevel: 'intermediate', // Could be made dynamic
            specificQuestion: textToSend,
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate quick teaching');
        }

        const teachingResult = await response.json();

        // Format the quick teaching response
        const formattedResponse = `## ${teachingResult.teachingContent}

**Key Points:**
${teachingResult.keyPoints.map((point: any) => `• ${point}`).join('\n')}

**Example:**
${teachingResult.example}

**Next Step:**
${teachingResult.nextStep}`;

        result = { answer: formattedResponse };
      } else {
        // Use fast chat for simple questions
        const response = await fetch('/api/ai/fast-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: textToSend,
            history: history,
            context: {
              course: course.title,
              lesson: currentLesson?.title,
            },
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get fast chat response');
        }

        result = await response.json();
      }
      const modelMessage: Message = { role: 'model', text: result.answer };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Course Tutor error:', error);
      toast({
        title: 'Error',
        description: 'Could not get a response from the AI Tutor. Please try again.',
        variant: 'destructive',
      });
      setMessages((prev) => prev.slice(0, -1)); // Revert user message
    } finally {
      setIsLoading(false);
      removeFile();
    }
  };

  const handleSend = async () => {
    await sendMessage();
  };

  return (
    <div className="flex h-[60vh] min-h-[460px] flex-col rounded-lg border sm:h-[70vh]">
       <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
             <div className="space-y-4 pr-2 sm:pr-4">
              {messages.length === 0 && !isLoading && (
                 <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">AI Teacher for {course.title}</h3>
                    <p className="mb-4">I'll automatically start teaching you this lesson with comprehensive explanations, practical examples, and interactive learning!</p>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Quick Learning Options:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => setInput("Explain this lesson step by step with comprehensive details")} className="text-xs">
                          Complete Guide
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setInput("Teach me everything about this topic with practical examples")} className="text-xs">
                          Full Teaching
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setInput("Give me a detailed explanation of all key concepts")} className="text-xs">
                          Key Concepts
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setInput("Show me common mistakes and how to avoid them")} className="text-xs">
                          Common Mistakes
                        </Button>
                      </div>
                    </div>
                 </div>
              )}
              {isLoading && messages.length === 0 && (
                 <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Starting AI Teaching...</h3>
                    <p className="mb-4">Your AI teacher is preparing a comprehensive lesson for you!</p>
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading lesson content...</span>
                    </div>
                 </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'model' && (
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><Bot className="h-5 w-5 text-primary"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 sm:max-w-[80%] sm:px-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                     <div className={`prose prose-sm max-w-none ${
                      message.role === 'user' 
                        ? 'prose-invert text-white [&>*]:text-white [&_strong]:text-white [&_em]:text-white [&_code]:text-white [&_a]:text-white' 
                        : 'dark:prose-invert'
                    }`}>
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><Bot className="h-5 w-5 text-primary"/></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
              )}
            </div>
        </ScrollArea>
       </div>
       <div className="border-t bg-muted/50 p-3 sm:p-4">
         {file && (
           <div className="mb-2 flex items-center gap-3 p-2 rounded-lg border bg-background">
             {file.type.startsWith('image/') ? <ImageIcon className="h-5 w-5 text-muted-foreground" /> : <FileIcon className="h-5 w-5 text-muted-foreground" />}
             <span className="text-sm truncate flex-1">{file.name}</span>
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeFile}>
                <X className="h-4 w-4" />
             </Button>
           </div>
         )}
         <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSend();
            }}
            className="flex w-full items-center gap-1.5 sm:gap-2"
            >
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                         >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Attach File</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            />
            
            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this course or your attached file..."
                autoComplete="off"
                disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !file)}>
                <Send className="h-5 w-5" />
            </Button>
            </form>
       </div>
    </div>
  );
}
