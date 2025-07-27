
'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { courseCreatorAgent, type CreatorAgentOutput } from '@/ai/flows/course-creator-agent-flow';
import { Bot, Download, Loader2, Send, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditableLessonForm } from '@/components/admin/EditableLessonForm';
import { type Lesson } from '@/lib/data-provider';


type Message = {
  role: 'user' | 'model';
  text: string;
};

export default function CourseCreatorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [generatedLesson, setGeneratedLesson] = useState<Lesson | null>(null);

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
        toast({ title: 'Lesson Content Generated!', description: 'The AI has populated the lesson editor for you.' });
      }

    } catch (error) {
      console.error('Course Creator error:', error);
      toast({
        title: 'Error',
        description: 'Could not get a response from the AI. Please try again.',
        variant: 'destructive',
      });
      // Do not revert user message on error
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
    <AppLayout>
      <div className="grid md:grid-cols-2 gap-8 h-[85vh]">
        <Card className="flex flex-col">
           <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              AI Course Co-pilot
            </CardTitle>
            <CardDescription>
              Converse with the AI to generate lessons. The AI will populate the editor on the right for you to review and modify.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
             <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                   <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-2" />
                      <p>Tell me what course you'd like to build today.</p>
                      <p className="text-xs mt-2">e.g., "Create a lesson about React Hooks"</p>
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

        <Card className="overflow-y-auto">
            <CardHeader>
              <CardTitle>Lesson Editor</CardTitle>
              <CardDescription>AI-generated content will appear here. You can edit it before saving.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="editor">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="export">Export JSON</TabsTrigger>
                    </TabsList>
                    <TabsContent value="editor" className="mt-4">
                        {generatedLesson ? (
                            <EditableLessonForm lesson={generatedLesson} setLesson={setGeneratedLesson} onLessonChange={() => {}} lessonIndex={0} />
                        ) : (
                             <div className="flex flex-col items-center justify-center h-[60vh] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>Waiting for lesson generation...</p>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="export" className="mt-4">
                         {generatedLesson ? (
                            <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                 <p className="text-sm text-muted-foreground">Review the final JSON before downloading.</p>
                                 <Button onClick={handleDownload} variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download JSON
                                 </Button>
                               </div>
                               <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto h-[55vh]">
                                  {JSON.stringify(generatedLesson, null, 2)}
                              </pre>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-[60vh] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>Waiting for content to export...</p>
                            </div>
                        )}
                    </TabsContent>
                 </Tabs>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
