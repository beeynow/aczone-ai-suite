import { useState } from "react";
import { Copy, Share2, Check, Mail, MessageSquare } from "lucide-react";
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

interface ShareInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  joiningCode: string;
  interviewTitle: string;
}

export default function ShareInterviewModal({
  open,
  onOpenChange,
  joiningCode,
  interviewTitle
}: ShareInterviewModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = `${window.location.origin}/join-interview?code=${joiningCode}`;

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
    const subject = encodeURIComponent(`Join my interview: ${interviewTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nYou're invited to join my group interview session!\n\n` +
      `Interview: ${interviewTitle}\n` +
      `Joining Code: ${joiningCode}\n` +
      `Or click this link: ${shareUrl}\n\n` +
      `See you there!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Join my group interview: ${interviewTitle}\n\n` +
      `Joining Code: ${joiningCode}\n` +
      `Link: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my interview: ${interviewTitle}`,
          text: `Joining Code: ${joiningCode}`,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Interview
          </DialogTitle>
          <DialogDescription>
            Invite others to join your group interview session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Joining Code */}
          <div className="space-y-2">
            <Label>Joining Code</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={joiningCode}
                className="text-center text-2xl font-mono tracking-widest font-bold"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(joiningCode, 'code')}
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with participants
            </p>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(shareUrl, 'link')}
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

          {/* Share Options */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
