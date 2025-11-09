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
        className="w-80 md:w-96 p-0 border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl bg-background/95 rounded-2xl overflow-hidden"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-5 border-b border-border/30 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5">
          <h3 className="font-bold text-lg flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
              <Bell className="w-[1.1rem] h-[1.1rem] text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Notifications
            </span>
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8 px-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg font-medium"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="bg-gradient-to-br from-primary/20 to-accent/10 p-6 rounded-2xl mb-5 shadow-inner">
                <Bell className="w-14 h-14 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-5 hover:bg-accent/20 transition-all duration-200 cursor-pointer relative group ${
                    !notification.read ? "bg-primary/5 border-l-[3px] border-l-primary shadow-sm" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 p-2.5 rounded-xl bg-gradient-to-br from-background/80 to-background/60 shadow-md border border-border/20">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-[0.9rem] truncate text-foreground">
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 -mt-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-3.5">
                        <span className="text-[0.75rem] text-muted-foreground/90 flex items-center gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/20">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(notification.created_at)}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[0.75rem] px-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-3 h-3 mr-1.5" />
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
