import { useState, useEffect } from "react";
import { Bell, X, Clock, Calendar, Award, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsModal() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification removed");
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "interview":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "achievement":
        return <Award className="w-4 h-4 text-green-500" />;
      case "meeting":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
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

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === activeTab);
  };

  const filteredNotifications = getFilteredNotifications();

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
        className="w-[500px] p-0 border-none shadow-xl bg-background rounded-3xl overflow-hidden"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
          <h2 className="text-xl font-bold text-foreground">Your Notifications</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4 border-b border-border/30">
            <TabsList className="w-full justify-start gap-6 bg-transparent border-b-0 h-auto p-0">
              <TabsTrigger 
                value="all" 
                className="relative pb-3 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-semibold"
              >
                All
                {notifications.length > 0 && (
                  <Badge className="ml-2 h-5 px-2 bg-muted text-muted-foreground font-normal rounded-full">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="unread"
                className="relative pb-3 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-semibold"
              >
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-2 h-5 px-2 bg-primary text-primary-foreground font-normal rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <ScrollArea className="h-[450px]">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-muted-foreground">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="bg-muted/50 p-6 rounded-2xl mb-4">
                    <Bell className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <p className="text-base font-semibold text-foreground">No notifications yet</p>
                  <p className="text-sm text-muted-foreground mt-2">You're all caught up! 🎉</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-6 py-4 hover:bg-muted/30 transition-colors duration-150 flex items-start gap-4 group relative cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-background/80 to-background/60 shadow-md border border-border/20">
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <h4 className="font-semibold text-sm text-foreground">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{getTimeAgo(notification.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {!notification.read && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium text-sm h-8"
            onClick={() => {
              if (filteredNotifications.length > 0) {
                filteredNotifications.forEach(n => deleteNotification(n.id));
              }
            }}
            disabled={filteredNotifications.length === 0}
          >
            Clear all
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10 font-semibold text-sm h-8"
              onClick={markAllAsRead}
            >
              <Bell className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}