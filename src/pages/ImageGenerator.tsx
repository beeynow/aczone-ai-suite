import { useState } from "react";
import { Sparkles, Download, ZoomIn, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const STABLE_HORDE_API_KEY = "6wMKS8nGojrwfEvW69i18w";

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateImages = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    toast.info("Generating images...");

    try {
      // Stable Horde API call
      const response = await fetch("https://stablehorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": STABLE_HORDE_API_KEY,
        },
        body: JSON.stringify({
          prompt: prompt,
          params: {
            n: 4,
            width: 512,
            height: 512,
            steps: 30,
          },
        }),
      });

      const data = await response.json();
      
      if (data.id) {
        // Poll for results
        const checkInterval = setInterval(async () => {
          const statusResponse = await fetch(
            `https://stablehorde.net/api/v2/generate/check/${data.id}`
          );
          const statusData = await statusResponse.json();

          if (statusData.done) {
            clearInterval(checkInterval);
            
            const resultsResponse = await fetch(
              `https://stablehorde.net/api/v2/generate/status/${data.id}`
            );
            const resultsData = await resultsResponse.json();

            if (resultsData.generations && resultsData.generations.length > 0) {
              const newImages: GeneratedImage[] = resultsData.generations.map((gen: any) => ({
                url: gen.img,
                prompt: prompt,
                timestamp: Date.now(),
              }));

              setImages(newImages);
              
              // Save to localStorage
              const history = JSON.parse(localStorage.getItem("imageHistory") || "[]");
              localStorage.setItem(
                "imageHistory",
                JSON.stringify([...history, ...newImages].slice(-20))
              );

              toast.success("Images generated successfully!");
            }
            
            setIsLoading(false);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error generating images:", error);
      toast.error("Failed to generate images. Using mock data instead.");
      
      // Fallback to mock images
      const mockImages: GeneratedImage[] = Array(4)
        .fill(null)
        .map((_, i) => ({
          url: `https://picsum.photos/512/512?random=${Date.now() + i}`,
          prompt: prompt,
          timestamp: Date.now(),
        }));

      setImages(mockImages);
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `aczone-image-${Date.now()}.png`;
    link.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Image Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create stunning AI-generated images with Stable Horde
        </p>
      </div>

      {/* Input */}
      <Card className="p-6">
        <div className="flex gap-3">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateImages()}
            placeholder="Describe the image you want to generate..."
            className="flex-1"
          />
          <Button
            onClick={generateImages}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Generating your images...</p>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && !isLoading && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadImage(image.url)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(image.url, "_blank")}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.prompt}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No images generated yet</h3>
          <p className="text-muted-foreground">
            Enter a prompt above to start creating amazing AI images
          </p>
        </Card>
      )}
    </div>
  );
}
