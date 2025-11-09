import { useState } from "react";
import { Bell, X, Trash2, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  time: string;
  read: boolean;
  action_button?: {
    label: string;
    action: () => void;
  };
}

export default function NotificationsModal() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      user_name: "Noah Anderson",
      user_avatar: undefined,
      action: "liked your post",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "2",
      user_name: "Olivia Parker",
      user_avatar: undefined,
      action: "mentioned you in a comment.",
      time: "3 hours ago",
      read: false,
    },
    {
      id: "3",
      user_name: "Ethan Ramirez",
      user_avatar: undefined,
      action: "liked your post.",
      time: "6 hours ago",
      read: false,
    },
    {
      id: "4",
      user_name: "Lucas Mitchell",
      user_avatar: undefined,
      action: "followed you.",
      time: "8 hours ago",
      read: false,
      action_button: {
        label: "Follow Back",
        action: () => toast.success("Followed back!"),
      },
    },
    {
      id: "5",
      user_name: "Emily Johnson",
      user_avatar: undefined,
      action: "liked your post.",
      time: "1 day ago",
      read: true,
    },
  ]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

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

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications;
    if (activeTab === "following") return notifications.filter(n => n.action.includes("followed"));
    if (activeTab === "archive") return notifications.filter(n => n.read);
    return notifications;
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
                value="following"
                className="relative pb-3 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-semibold"
              >
                Following
              </TabsTrigger>
              <TabsTrigger 
                value="archive"
                className="relative pb-3 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-semibold"
              >
                Archive
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <ScrollArea className="h-[450px]">
              {filteredNotifications.length === 0 ? (
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
                      className="px-6 py-4 hover:bg-muted/30 transition-colors duration-150 flex items-start gap-4 group relative"
                    >
                      <Avatar className="h-12 w-12 border-2 border-border/20">
                        <AvatarImage src={notification.user_avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {notification.user_name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{notification.user_name}</span>{" "}
                          <span className="text-muted-foreground">{notification.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        {notification.action_button && (
                          <Button
                            size="sm"
                            className="mt-3 h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
                            onClick={notification.action_button.action}
                          >
                            {notification.action_button.label}
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {!notification.read && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => toast.info("Archive feature coming soon")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => toast.info("Settings feature coming soon")}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10 font-semibold text-sm h-8"
            onClick={markAllAsRead}
          >
            <Bell className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
