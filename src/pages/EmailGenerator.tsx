import { useState } from "react";
import { Mail, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function EmailGenerator() {
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState("professional");
  const [purpose, setPurpose] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const generateEmail = () => {
    if (!subject || !purpose) {
      toast.error("Please fill in all fields");
      return;
    }

    const email = `Subject: ${subject}

Dear [Recipient],

${purpose}

${
  tone === "professional"
    ? "I look forward to hearing from you at your earliest convenience."
    : tone === "casual"
    ? "Let me know what you think!"
    : "I would greatly appreciate your prompt response to this matter."
}

Best regards,
[Your Name]`;

    setGeneratedEmail(email);
    toast.success("Email generated!");
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Email Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate professional email templates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Email Details</h3>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose/Message</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is the main purpose of this email?"
              rows={4}
            />
          </div>

          <Button onClick={generateEmail} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Email
          </Button>
        </Card>

        {/* Preview */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Generated Email</h3>
            {generatedEmail && (
              <Button size="sm" variant="outline" onClick={copyEmail}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>

          {generatedEmail ? (
            <div className="bg-muted/50 p-4 rounded-lg min-h-[300px]">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {generatedEmail}
              </pre>
            </div>
          ) : (
            <div className="bg-muted/50 p-4 rounded-lg min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Fill in the form to generate an email
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
