import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function HelpChat({ userEmail }: { userEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey there! 👋 I'm your friendly AI assistant, and I'm super excited to help you today! Let's make your interview experience awesome together! ✨",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-chat`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      // Create the assistant message placeholder
      const aiMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              aiContent += content;
              // Update the assistant message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: aiContent } : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              aiContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: aiContent } : m
                )
              );
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      // Remove the empty assistant message if error occurred
      setMessages((prev) => prev.filter((m) => m.content !== ""));
    } finally {
      setIsLoading(false);
    }
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-accent text-white hover:scale-110 transition-smooth glow-primary z-50 group"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-smooth" />
        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
      </Button>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col border-2 shadow-2xl">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b-2 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-left flex items-center gap-2">
                    AI Assistant
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground text-left">Here to help you! 🚀</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-muted transition-smooth"
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
                  className={`flex gap-3 animate-fade-in ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className="w-8 h-8 flex-shrink-0 border-2 border-primary/20 shadow-md">
                    {message.role === "assistant" ? (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    ) : (
                      <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
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
                      className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 shadow-md transition-smooth ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/90 text-white"
                          : "bg-card border-2 border-border/50"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 px-1 opacity-70">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <Avatar className="w-8 h-8 flex-shrink-0 border-2 border-primary/20">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  </Avatar>
                  <div className="bg-card border-2 border-border/50 rounded-2xl px-4 py-3 shadow-md">
                    <LoadingSpinner size="sm" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t-2 bg-muted/30">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                placeholder="Type your message... ✨"
                className="flex-1 bg-background border-2 focus:border-primary transition-smooth"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                className="bg-gradient-to-br from-primary to-accent text-white hover:scale-110 transition-smooth shadow-lg rounded-full"
                size="icon"
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by TryInterview AI
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
