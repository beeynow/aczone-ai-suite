import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TextGenerator() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI text assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content: `This is a mock response to: "${input}". In production, this would connect to an AI API like OpenAI.`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      
      // Save to localStorage
      const history = JSON.parse(localStorage.getItem("textHistory") || "[]");
      localStorage.setItem(
        "textHistory",
        JSON.stringify([...history, { userMessage, assistantMessage, timestamp: Date.now() }])
      );
    }, 1000);
  };

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-4 bg-card">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message... (Press Enter to send)"
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-auto px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      <div className="w-80 border-l border-border p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Recent Conversations</h3>
        <div className="space-y-2">
          {["AI Wave Definition", "Your last Question", "Business Shortcut Methods", "Best way to maintain code Quality"].map(
            (item, index) => (
              <Card
                key={index}
                className="p-3 cursor-pointer hover:bg-muted transition-smooth"
              >
                <p className="text-sm font-medium">{item}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {index === 0 ? "Today" : "Yesterday"}
                </p>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
