import { useState } from "react";
import { Copy, Check, Mail, MessageSquare, Share2, Video, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MeetingSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  meetingCode: string;
  onJoinNow: () => void;
}

export default function MeetingSuccessModal({
  open,
  onOpenChange,
  meetingId,
  meetingTitle,
  meetingCode,
  onJoinNow,
}: MeetingSuccessModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const meetingUrl = `${window.location.origin}/meeting/${meetingId}`;

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join my meeting: ${meetingTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nYou're invited to join my meeting!\n\n` +
      `Meeting: ${meetingTitle}\n` +
      `Meeting Code: ${meetingCode}\n` +
      `Or click this link: ${meetingUrl}\n\n` +
      `See you there!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Join my meeting: ${meetingTitle}\n\n` +
      `Meeting Code: ${meetingCode}\n` +
      `Link: ${meetingUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my meeting: ${meetingTitle}`,
          text: `Meeting Code: ${meetingCode}`,
          url: meetingUrl
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Meeting Created Successfully! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            Share this meeting with participants or join now
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meeting Code */}
          <div className="space-y-2">
            <Label>Meeting Code</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={meetingCode}
                className="text-center text-2xl font-mono tracking-widest font-bold"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(meetingCode, 'code')}
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with participants to join
            </p>
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label>Meeting Link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={meetingUrl}
                className="text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(meetingUrl, 'link')}
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Or share this direct link
            </p>
          </div>

          {/* Quick Share Options */}
          <div className="pt-4 border-t space-y-2">
            <Label>Quick Share</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                onClick={shareViaWhatsApp}
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
            
            {navigator.share && (
              <Button
                variant="outline"
                onClick={shareViaNative}
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                More Options
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={onJoinNow}
              className="flex-1"
            >
              <Video className="w-4 h-4 mr-2" />
              Join Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
