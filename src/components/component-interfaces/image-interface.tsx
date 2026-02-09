import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileImage, ListPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ImageData {
  type: "image";
  src: string;
}

interface ImageInterfaceProps {
  imageUrlInput: string;
  setImageUrlInput: (url: string) => void;
  setJsonOutputs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ImageInterface({
  imageUrlInput,
  setImageUrlInput,
  setJsonOutputs
}: ImageInterfaceProps) {
  const { toast } = useToast();

  const handleAddImageToMain = () => {
    const trimmedImageUrl = imageUrlInput.trim();

    if (!trimmedImageUrl) {
      toast({ title: "Error", description: "Image URL cannot be empty.", variant: "destructive" });
      return;
    }

    const imageObject: ImageData = {
      type: "image",
      src: trimmedImageUrl,
    };

    try {
      const jsonString = JSON.stringify(imageObject, null, 2);
      setJsonOutputs(prev => [...prev, jsonString]);
      toast({ title: "Image Snippet Added", description: `Image snippet for "${imageObject.src}" added to main output.` });

      setImageUrlInput('');
    } catch (error) {
      console.error("Error stringifying image object:", error);
      toast({ title: "Compilation Error", description: "Could not generate the image JSON. Check console.", variant: "destructive"});
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <FileImage className="mr-2 h-5 w-5" />
          Image Snippet Compiler
        </CardTitle>
        <CardDescription>Enter image URL to generate the JSON snippet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="image-url-input">Image URL</Label>
          <Input
            id="image-url-input"
            placeholder="Image URL (e.g., https://example.com/image.jpg)"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
          />
        </div>
        <Button onClick={handleAddImageToMain} className="w-full" disabled={!imageUrlInput.trim()}>
          <ListPlus className="mr-2 h-4 w-4" /> Add to Main Output
        </Button>
      </CardContent>
    </Card>
  );
}