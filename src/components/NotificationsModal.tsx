import { useState, useEffect } from "react";
import { Bell, Check, X, Clock, UserCheck, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "interview" | "achievement" | "system";
  read: boolean;
  created_at: string;
}

export default function NotificationsModal() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Interview Scheduled",
      message: "Your interview for Senior Developer position is scheduled for tomorrow",
      type: "interview",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Achievement Unlocked!",
      message: "You've completed 5 interviews! Keep up the great work.",
      type: "achievement",
      read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      title: "Profile Updated",
      message: "Your profile has been successfully updated",
      type: "system",
      read: true,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notification removed");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "interview":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "achievement":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 md:w-96 p-0 border-2 shadow-2xl backdrop-blur-sm bg-card/95"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hover:bg-primary/10 transition-smooth"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Bell className="w-12 h-12 text-primary" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/30 transition-smooth cursor-pointer relative ${
                    !notification.read ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-background/50 shadow-sm">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-1 hover:bg-destructive/10 hover:text-destructive transition-smooth"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(notification.created_at)}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 hover:bg-primary/10 hover:text-primary transition-smooth"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
