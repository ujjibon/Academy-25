'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { courseCreatorAgent } from '@/ai/flows/course-creator-agent-flow';
import { Bot, Download, Loader2, Send, Sparkles, User, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditableLessonForm } from '@/components/admin/EditableLessonForm';
import { FullCourseFromPromptPanel } from '@/components/instructor/FullCourseFromPromptPanel';
import { type Lesson } from '@/lib/data-provider';
import { ClipboardPaste, MessageSquare } from 'lucide-react';

type Message = {
  role: 'user' | 'model';
  text: string;
};

interface CourseCreatorContentProps {
  showHeader?: boolean;
  onCoursePublished?: () => void;
}

export function CourseCreatorContent({
  showHeader = true,
  onCoursePublished,
}: CourseCreatorContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [generatedLesson, setGeneratedLesson] = useState<Lesson | null>(null);
  const [suggestedNext, setSuggestedNext] = useState<{
    suggestedTitle: string;
    suggestedTopic: string;
    rationale: string;
  } | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.text }],
      }));

      const result = await courseCreatorAgent({ instruction: input, history });
      const modelMessage: Message = { role: 'model', text: result.response };
      setMessages((prev) => [...prev, modelMessage]);

      if (result.generatedLesson) {
        setGeneratedLesson(result.generatedLesson as Lesson);
        setSuggestedNext(null);
        toast({
          title: 'Lesson content generated',
          description: 'Review and edit the lesson in the editor panel.',
        });
      }
      if (result.suggestedNextLesson) {
        setSuggestedNext(result.suggestedNextLesson);
      }
    } catch (error) {
      console.error('Course Creator error:', error);
      toast({
        title: 'Error',
        description: 'Could not get a response from the AI. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedLesson) return;
    const jsonString = JSON.stringify(generatedLesson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedLesson.id || 'lesson'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {showHeader ? (
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">AI Course Creator</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Agentic architect for full courses, or lesson-by-lesson chat with planning tools.
          </p>
        </div>
      ) : null}

      <Tabs defaultValue="prompt" className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="prompt" className="gap-2 data-[state=active]:bg-background">
            <ClipboardPaste className="h-4 w-4" />
            Paste prompt
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-background">
            <MessageSquare className="h-4 w-4" />
            Lesson chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="mt-6">
          <FullCourseFromPromptPanel embedded onCoursePublished={onCoursePublished} />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:min-h-[32rem]">
        <Card className="brand-card flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              AI Course Co-pilot
            </CardTitle>
            <CardDescription>
              Agentic co-pilot with lesson generation and next-lesson planning tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            <ScrollArea className="flex-1 p-4 min-h-[16rem]" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-2" />
                    <p>Tell me what course you&apos;d like to build.</p>
                    <p className="text-xs mt-2">e.g. &quot;Create a lesson about React Hooks&quot;</p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'model' && (
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback>
                          <Bot className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback>
                        <Bot className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            {suggestedNext && (
              <div className="px-4 pb-2">
                <button
                  type="button"
                  className="w-full text-left rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-sm hover:bg-primary/10 transition-colors"
                  onClick={() =>
                    setInput(
                      `Create a lesson on "${suggestedNext.suggestedTopic}" titled "${suggestedNext.suggestedTitle}"`
                    )
                  }
                >
                  <span className="font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Suggested next lesson
                  </span>
                  <p className="mt-1 text-muted-foreground">{suggestedNext.rationale}</p>
                  <Badge variant="secondary" className="mt-2">
                    {suggestedNext.suggestedTitle}
                  </Badge>
                </button>
              </div>
            )}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex w-full items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Your instructions..."
                  autoComplete="off"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="brand-card overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">Lesson editor</CardTitle>
            <CardDescription>Edit AI-generated content before exporting.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="editor">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="export">Export JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="mt-4">
                {generatedLesson ? (
                  <EditableLessonForm
                    lesson={generatedLesson}
                    setLesson={setGeneratedLesson}
                    onLessonChange={() => {}}
                    lessonIndex={0}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[16rem] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Waiting for lesson generation...</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="export" className="mt-4">
                {generatedLesson ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <p className="text-sm text-muted-foreground">Download lesson JSON.</p>
                      <Button onClick={handleDownload} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download JSON
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[20rem]">
                      {JSON.stringify(generatedLesson, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[16rem] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Nothing to export yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
