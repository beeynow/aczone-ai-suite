import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import {
  Settings,
  FileText,
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  Sparkles,
  LogOut,
  Home,
  Check,
  Award,
  UserPlus,
  Brain,
  BarChart3,
  FileCheck,
  Trophy,
  Gift,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { HelpChat } from "@/components/HelpChat";
import JoinMeetingDialog from "@/components/JoinMeetingDialog";
import NotificationsModal from "@/components/NotificationsModal";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import LoadingSpinner from "@/components/LoadingSpinner";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Question Bank", href: "/question-bank", icon: Brain, badge: "NEW" },
  { name: "Join Interview", href: "/join-interview", icon: UserPlus },
  { name: "AI Interview", href: "/create-interview", icon: FileText },
  { name: "Meeting Room", href: "/create-meeting", icon: Video, badge: "NEW" },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Resume Analyzer", href: "/resume-analyzer", icon: FileCheck },
  { name: "Certificates", href: "/certificates", icon: Award },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy, badge: "NEW" },
  { name: "Achievements", href: "/achievements", icon: Award, badge: "NEW" },
  { name: "Referrals", href: "/referrals", icon: Gift },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    } else {
      navigate("/auth");
    }
  };

  if (!user) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                TryInterview
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-sm font-medium">
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-1">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Upgrade Button */}
        {sidebarOpen && (
          <div className="p-4 border-t border-border">
            <Button 
              className="w-full gradient-primary text-white hover:opacity-90"
              onClick={() => setShowUpgradeDialog(true)}
            >
              Upgrade to Pro
            </Button>
          </div>
        )}

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 text-xs text-center text-muted-foreground border-t border-border">
            © 2025 TryInterview
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-full items-center gap-2 md:gap-4 px-3 md:px-6">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10 bg-muted/50 border-muted h-9"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Join Meeting - Hidden on small screens */}
              <div className="hidden sm:block">
                <JoinMeetingDialog />
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="h-9 w-9 relative"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Notifications */}
              <NotificationsModal />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-muted"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-primary text-white text-sm">
                        {user.email?.substring(0, 2).toUpperCase() || "AZ"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">
                        {user.email?.split("@")[0] || "User"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Purchase Points</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <PriceRangeSlider />
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Chat */}
      <HelpChat userEmail={user.email} />
    </div>
  );
}
