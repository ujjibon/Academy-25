'use client';
import { useState, useRef, useEffect } from 'react';
import type { Course } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Loader2, Send, User, Paperclip, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { courseTutor } from '@/ai/flows/course-tutor-flow';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export function CourseTutor({ course }: { course: Course }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);

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

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    const userMessage: Message = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({ // Use the existing messages state for history
        user: msg.role === 'user' ? msg.text : '',
        model: msg.role === 'model' ? msg.text : '',
      }));
      
      const result = await courseTutor({
        question: input,
        fileDataUri: fileDataUri || undefined,
        history,
        courseContext: {
            title: course.title,
            description: course.description,
            lessons: course.lessons.map(l => ({id: l.id, title: l.title, duration: l.duration})),
        },
        userPreferences: {
            learningStyle: 'practical', // Example preference
        }
      });
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

  return (
    <div className="flex flex-col h-[70vh] border rounded-lg">
       <div className="flex-1 p-4 overflow-y-auto">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
             <div className="space-y-4 pr-4">
              {messages.length === 0 && (
                 <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold">AI Teacher for {course.title}</h3>
                    <p>Ask me anything about this course, or upload a file for review!</p>
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
       </div>
       <div className="p-4 border-t bg-muted/50">
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
            className="flex w-full items-center gap-2"
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
