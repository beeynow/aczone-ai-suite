import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const sampleMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! 👋 I'm your AI assistant. How can I help you today?",
    timestamp: new Date(),
  },
  {
    id: "2",
    role: "user",
    content: "How do I start a new interview?",
    timestamp: new Date(),
  },
  {
    id: "3",
    role: "assistant",
    content: "Great question! You can start a new interview by clicking on 'Create Interview' in the sidebar. From there, you can choose the interview type, set the duration, and customize your questions. Would you like me to guide you through the process?",
    timestamp: new Date(),
  },
];

export function HelpChat({ userEmail }: { userEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm here to help! Let me assist you with that...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg gradient-primary text-white hover:opacity-90 transition-smooth z-50 glow-primary"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-border bg-gradient-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-white text-left">AI Assistant</SheetTitle>
                  <p className="text-xs text-white/80 text-left">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 transition-smooth"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {message.role === "assistant" ? (
                      <div className="w-full h-full rounded-full bg-gradient-primary flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <AvatarFallback className="bg-gradient-primary text-white text-xs">
                        {userEmail?.substring(0, 2).toUpperCase() || "YO"}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Message Content */}
                  <div
                    className={`flex-1 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 ${
                        message.role === "user"
                          ? "bg-gradient-primary text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-muted/50 border-muted"
              />
              <Button
                onClick={handleSend}
                className="gradient-primary text-white hover:opacity-90 transition-smooth"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by TryInterview AI
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
