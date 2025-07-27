'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { chat } from '@/ai/flows/chat-flow';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../Logo';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        user: msg.role === 'user' ? msg.text : '',
        model: msg.role === 'model' ? msg.text : '',
      }));
      
      const result = await chat({ question: input, history });
      const modelMessage: Message = { role: 'model', text: result.answer };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast({
        title: 'Error',
        description: 'Could not get a response from the AI. Please try again.',
        variant: 'destructive',
      });
      setMessages(messages); // Revert to previous state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-7 w-7" />
        <span className="sr-only">Open AI Chat</span>
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full max-w-lg flex flex-col p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Logo /> AI Assistant
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                 <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-2" />
                    <p>Welcome! How can I help you learn today?</p>
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
          <SheetFooter className="p-4 border-t">
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
                placeholder="Ask anything..."
                autoComplete="off"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
