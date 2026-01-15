import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const releases = [
  {
    version: "2.0.0",
    date: "2024-01-15",
    type: "major",
    changes: [
      "Complete UI redesign with modern dark theme",
      "Added Stable Horde integration for image generation",
      "New Website Generator with live preview",
      "Improved code syntax highlighting",
      "Enhanced mobile responsiveness",
    ],
  },
  {
    version: "1.5.0",
    date: "2023-12-20",
    type: "minor",
    changes: [
      "Added Image Editor with filters",
      "Video Generator improvements",
      "New email templates",
      "Performance optimizations",
    ],
  },
  {
    version: "1.4.0",
    date: "2023-11-10",
    type: "minor",
    changes: [
      "Code Generator now supports 6 languages",
      "Activity log and usage tracking",
      "Settings page overhaul",
      "Bug fixes and stability improvements",
    ],
  },
  {
    version: "1.3.0",
    date: "2023-10-05",
    type: "minor",
    changes: [
      "Initial Email Generator release",
      "Dark mode support",
      "Notification system",
      "Export functionality for all generators",
    ],
  },
];

export default function ReleaseNotes() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Release Notes</h1>
        <p className="text-muted-foreground mt-1">
          What's new in AcZone
        </p>
      </div>

      <div className="space-y-6">
        {releases.map((release) => (
          <Card key={release.version} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">v{release.version}</h3>
                  <Badge
                    variant={release.type === "major" ? "default" : "secondary"}
                  >
                    {release.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{release.date}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {release.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span className="text-sm">{change}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
