import { useState } from "react";
import { Upload, Crop, Maximize2, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function ImageEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        toast.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Image Editor</h1>
        <p className="text-muted-foreground mt-1">
          Edit and enhance your images
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {image ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  }}
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No image uploaded</p>
                  <Button className="mt-4" onClick={() => document.getElementById("imageUpload")?.click()}>
                    Upload Image
                  </Button>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Tools */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Adjustments
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Brightness: {brightness}%</Label>
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  min={0}
                  max={200}
                  step={1}
                  disabled={!image}
                />
              </div>
              <div className="space-y-2">
                <Label>Contrast: {contrast}%</Label>
                <Slider
                  value={[contrast]}
                  onValueChange={(value) => setContrast(value[0])}
                  min={0}
                  max={200}
                  step={1}
                  disabled={!image}
                />
              </div>
              <div className="space-y-2">
                <Label>Saturation: {saturation}%</Label>
                <Slider
                  value={[saturation]}
                  onValueChange={(value) => setSaturation(value[0])}
                  min={0}
                  max={200}
                  step={1}
                  disabled={!image}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Tools</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled={!image}>
                <Crop className="w-4 h-4 mr-2" />
                Crop
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled={!image}>
                <Maximize2 className="w-4 h-4 mr-2" />
                Resize
              </Button>
              <Button
                className="w-full"
                disabled={!image}
                onClick={() => toast.success("Image saved!")}
              >
                Save Image
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
