import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookText, ListPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PoemLine {
  type: "line";
  value: string;
}

interface PoemData {
  type: "poem";
  id: string;
  title: string;
  lines: PoemLine[];
}

interface PoemInterfaceProps {
  poemId: string;
  setPoemId: (id: string) => void;
  poemTitle: string;
  setPoemTitle: (title: string) => void;
  poemText: string;
  setPoemText: (text: string) => void;
  setJsonOutputs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function PoemInterface({
  poemId,
  setPoemId,
  poemTitle,
  setPoemTitle,
  poemText,
  setPoemText,
  setJsonOutputs
}: PoemInterfaceProps) {
  const { toast } = useToast();

  const handleAddPoemToMain = () => {
    const trimmedPoemId = poemId.trim();
    const trimmedPoemTitle = poemTitle.trim();
    const trimmedPoemText = poemText.trim();

    if (!trimmedPoemId) {
      toast({ title: "Error", description: "Poem ID cannot be empty.", variant: "destructive" });
      return;
    }
    if (!trimmedPoemTitle) {
      toast({ title: "Error", description: "Poem Title cannot be empty.", variant: "destructive" });
      return;
    }
    if (!trimmedPoemText) {
      toast({ title: "Error", description: "Poem text cannot be empty.", variant: "destructive" });
      return;
    }

    const linesArray = trimmedPoemText.split('\n').map(line => ({ type: "line" as "line", value: line.trim() })).filter(line => line.value);

    if (linesArray.length === 0) {
      toast({ title: "Error", description: "Poem text must contain at least one non-empty line.", variant: "destructive" });
      return;
    }

    const poemObject: PoemData = {
      type: "poem",
      id: trimmedPoemId,
      title: trimmedPoemTitle,
      lines: linesArray
    };

    try {
      const jsonString = JSON.stringify(poemObject, null, 2);
      setJsonOutputs(prev => [...prev, jsonString]);
      toast({ title: "Poem Added", description: `Poem "${poemObject.title}" added to main output.` });

      setPoemId('');
      setPoemTitle('');
      setPoemText('');
    } catch (error) {
      console.error("Error stringifying poem object:", error);
      toast({ title: "Compilation Error", description: "Could not generate the poem JSON. Check console.", variant: "destructive"});
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <BookText className="mr-2 h-5 w-5" />
          JSON Poem Snippet Compiler
        </CardTitle>
        <CardDescription>Enter poem ID, title, and text to generate its JSON structure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="poem-id-input">Poem ID</Label>
          <Input
            id="poem-id-input"
            placeholder="Enter poem ID (e.g., poem-001)"
            value={poemId}
            onChange={(e) => setPoemId(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="poem-title-input">Poem Title</Label>
          <Input
            id="poem-title-input"
            placeholder="Enter poem title"
            value={poemTitle}
            onChange={(e) => setPoemTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="poem-text-input">Poem Text</Label>
          <Textarea
            id="poem-text-input"
            placeholder="Enter poem text, each line on a new line..."
            value={poemText}
            onChange={(e) => setPoemText(e.target.value)}
            rows={6}
          />
        </div>
        <Button onClick={handleAddPoemToMain} className="w-full" disabled={!poemId.trim() || !poemTitle.trim() || !poemText.trim()}>
          <ListPlus className="mr-2 h-4 w-4" /> Add Poem to Main Output
        </Button>
      </CardContent>
    </Card>
  );
}