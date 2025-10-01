import { useState } from "react";
import { Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateVideo = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    toast.info("Generating video... This may take a while");

    // Mock video generation (in production, this would call Stable Horde or Replicate)
    setTimeout(() => {
      setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
      setIsLoading(false);
      toast.success("Video generated successfully!");
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Video Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create AI-generated videos from text prompts
        </p>
      </div>

      {/* Input */}
      <Card className="p-6 space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to generate..."
          rows={4}
        />
        <Button onClick={generateVideo} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </Card>

      {/* Preview */}
      {videoUrl && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Generated Video</h3>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video controls className="w-full h-full">
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!videoUrl && !isLoading && (
        <Card className="p-12 text-center">
          <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No video generated yet</h3>
          <p className="text-muted-foreground">
            Enter a prompt above to start creating AI videos
          </p>
        </Card>
      )}
    </div>
  );
}
