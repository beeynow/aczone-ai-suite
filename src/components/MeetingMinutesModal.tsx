import { useState, useRef } from "react";
import { FileText, Download, Share2, X, Calendar, Clock, Users, CheckCircle2, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface MeetingMinutes {
  id: string;
  meeting_id: string;
  summary: string;
  full_transcript: string | null;
  action_items: any[] | null;
  key_topics: any[] | null;
  participant_ratings: any | null;
  created_at: string;
}

interface MeetingMinutesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minutes: MeetingMinutes | null;
  meetingTitle: string;
  meetingDate: string;
  participants: string[];
}

export default function MeetingMinutesModal({
  open,
  onOpenChange,
  minutes,
  meetingTitle,
  meetingDate,
  participants,
}: MeetingMinutesModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imgData;
      link.click();
      
      toast.success("Meeting minutes downloaded!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download meeting minutes");
    } finally {
      setIsDownloading(false);
    }
  };

  const shareMinutes = async () => {
    const shareText = `Meeting Minutes: ${meetingTitle}\n\nSummary: ${minutes?.summary}\n\nDate: ${new Date(meetingDate).toLocaleDateString()}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meeting Minutes - ${meetingTitle}`,
          text: shareText,
        });
      } catch (error) {
        console.log("Share cancelled or failed:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Meeting minutes copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  if (!minutes) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Meeting Minutes</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareMinutes}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={downloadAsPDF}
                disabled={isDownloading}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div ref={contentRef} className="p-8 bg-background">
            {/* Document Header */}
            <div className="mb-8 pb-6 border-b-2 border-border">
              <h1 className="text-3xl font-bold mb-2">{meetingTitle}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(meetingDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(meetingDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{participants.length} Participants</span>
                </div>
              </div>
            </div>

            {/* Participants Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Attendees
              </h2>
              <div className="flex flex-wrap gap-2">
                {participants.map((participant, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {participant}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Executive Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Executive Summary
              </h2>
              <Card className="p-6 bg-muted/30">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {minutes.summary}
                </p>
              </Card>
            </div>

            {/* Key Topics */}
            {minutes.key_topics && minutes.key_topics.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Key Discussion Points
                </h2>
                <div className="space-y-3">
                  {minutes.key_topics.map((topic: any, index: number) => (
                    <Card key={index} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-semibold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{topic.topic || topic.title || topic}</h3>
                          {topic.description && (
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {minutes.action_items && minutes.action_items.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Action Items
                </h2>
                <div className="space-y-3">
                  {minutes.action_items.map((item: any, index: number) => (
                    <Card key={index} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{item.task || item.action || item.item || item}</p>
                          {item.assignee && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Assigned to: <span className="font-medium">{item.assignee}</span>
                            </p>
                          )}
                          {item.dueDate && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Due: {new Date(item.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {item.priority && (
                            <Badge variant="outline" className="mt-2">
                              {item.priority} Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Participant Ratings */}
            {minutes.participant_ratings && Object.keys(minutes.participant_ratings).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Participant Engagement</h2>
                <div className="grid gap-4">
                  {Object.entries(minutes.participant_ratings).map(([name, rating]: [string, any]) => (
                    <Card key={name} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${(rating.engagement || rating) * 10}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {rating.engagement || rating}/10
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Generated by AI Assistant on {new Date(minutes.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
