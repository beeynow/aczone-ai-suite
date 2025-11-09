import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  display_name?: string;
}

interface MeetingChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
}

export default function MeetingChatModal({
  open,
  onOpenChange,
  messages,
  currentUserId,
  onSendMessage,
}: MeetingChatModalProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Meeting Chat</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No messages yet</p>
                <p className="text-muted-foreground text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.user_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-offset-2 ring-border/20">
                      <AvatarFallback className={`text-xs font-semibold ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {msg.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <span className="text-xs font-medium text-muted-foreground mb-1">
                        {isCurrentUser ? 'You' : msg.display_name}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-t bg-muted/20">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 bg-background"
          />
          <Button 
            onClick={handleSend} 
            size="icon"
            disabled={!input.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
