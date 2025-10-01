import { Link } from "react-router-dom";
import {
  MessageSquare,
  ImageIcon,
  Code,
  Scissors,
  Video,
  Mail,
  Globe,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tools = [
  {
    name: "Text Generator",
    href: "/text",
    icon: MessageSquare,
    description: "Generate AI-powered text content",
    color: "bg-blue-500",
  },
  {
    name: "Image Generator",
    href: "/image",
    icon: ImageIcon,
    description: "Create stunning AI images",
    color: "bg-purple-500",
  },
  {
    name: "Code Generator",
    href: "/code",
    icon: Code,
    description: "Generate code snippets",
    color: "bg-green-500",
  },
  {
    name: "Image Editor",
    href: "/editor",
    icon: Scissors,
    description: "Edit and enhance images",
    color: "bg-orange-500",
  },
  {
    name: "Video Generator",
    href: "/video",
    icon: Video,
    description: "Create AI videos",
    color: "bg-red-500",
  },
  {
    name: "Email Generator",
    href: "/email",
    icon: Mail,
    description: "Generate email templates",
    color: "bg-cyan-500",
  },
  {
    name: "Website Generator",
    href: "/website",
    icon: Globe,
    description: "Build websites with AI",
    color: "bg-indigo-500",
  },
];

const stats = [
  {
    name: "Total Generations",
    value: "1,234",
    icon: Zap,
    change: "+12%",
  },
  {
    name: "Active Projects",
    value: "23",
    icon: Activity,
    change: "+5%",
  },
  {
    name: "Usage This Month",
    value: "456 MB",
    icon: TrendingUp,
    change: "+8%",
  },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Quick access to all your AI tools.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-500 mt-1">{stat.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Access Tools */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.name} to={tool.href}>
                <Card className="hover:shadow-lg transition-smooth hover:border-primary/50 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center group-hover:scale-110 transition-smooth`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "Generated image", time: "2 minutes ago", tool: "Image Generator" },
              { action: "Created website", time: "1 hour ago", tool: "Website Generator" },
              { action: "Generated code", time: "3 hours ago", tool: "Code Generator" },
              { action: "Edited image", time: "5 hours ago", tool: "Image Editor" },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.tool}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
