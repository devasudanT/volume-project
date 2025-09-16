import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Play, ListPlus, Trash2, BookCopy } from 'lucide-react';

interface PageData {
  type: "page";
  value: string;
  id: string;
}

interface TamilPageNumberCompilerProps {
  setJsonOutputs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function TamilPageNumberCompiler({ setJsonOutputs }: TamilPageNumberCompilerProps) {
  const [tamilPageNumberInput, setTamilPageNumberInput] = useState<string>('');
  const [compiledTamilPageNumberObject, setCompiledTamilPageNumberObject] = useState<PageData | null>(null);
  const { toast } = useToast();

  const handleTamilPageNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/\D/g, ''); // Keep only digits
    setTamilPageNumberInput(filteredValue);
  };

  const getFormattedTamilPagePreview = (input: string): string => {
    if (!input.trim()) return "Enter a page number (1-1000).";
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 1 || num > 1000) {
      return "Invalid: Must be a number between 1-1000.";
    }
    return `Formatted: Page ${num.toString().padStart(3, '0')}`;
  };

  const formattedTamilPagePreviewText = useMemo(() => getFormattedTamilPagePreview(tamilPageNumberInput), [tamilPageNumberInput]);
  const isTamilPageNumberValid = useMemo(() => {
    const num = parseInt(tamilPageNumberInput, 10);
    return !isNaN(num) && num >= 1 && num <= 1000;
  }, [tamilPageNumberInput]);

  const handleCompileTamilPageNumber = () => {
    const num = parseInt(tamilPageNumberInput, 10);
    if (!isTamilPageNumberValid) {
      toast({ title: "Error", description: "Please enter a valid page number (1-1000).", variant: "destructive" });
      return;
    }

    const pageId = `page-${String(num).padStart(3, '0')}`;
    const pageValue = `Page ${String(num).padStart(3, '0')}`;

    const pageObject: PageData = {
      type: "page",
      value: pageValue,
      id: pageId
    };

    try {
      const jsonString = JSON.stringify(pageObject, null, 2);
      setCompiledTamilPageNumberObject(pageObject);
      toast({ title: "Page Number Compiled", description: `Page number "${pageObject.value}" ready.` });
    } catch (error) {
      setCompiledTamilPageNumberObject(null);
      toast({ title: "Compilation Error", description: "Could not generate the page number JSON. Check console.", variant: "destructive"});
      console.error("Error stringifying page object:", error);
    }
  };

  const handleAddTamilPageNumberToMain = () => {
    if (!compiledTamilPageNumberObject) {
      toast({ title: "Error", description: "Compile a Tamil page number first.", variant: "destructive" });
      return;
    }
    setJsonOutputs(prev => [...prev, JSON.stringify(compiledTamilPageNumberObject, null, 2)]);
    toast({ title: "Tamil Page Number Added", description: `Page number "${compiledTamilPageNumberObject.value}" added to main output.` });
    setTamilPageNumberInput('');
    setCompiledTamilPageNumberObject(null);
  };

  const handleClearTamilPageNumber = () => {
    setTamilPageNumberInput('');
    setCompiledTamilPageNumberObject(null);
    toast({ title: "Cleared", description: "Tamil Book Page Number snippet cleared." });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <BookCopy className="h-6 w-6 mr-2" /> Tamil Book Page Number Snippet Compiler
        </CardTitle>
        <CardDescription>Generate JSON for Tamil book page numbers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tamil-page-number-input">Tamil Book Page Number</Label>
          <Input
            id="tamil-page-number-input"
            type="number"
            placeholder="e.g., 123"
            value={tamilPageNumberInput}
            onChange={handleTamilPageNumberInputChange}
            min="1"
            max="1000"
          />
          <p className="text-sm text-muted-foreground mt-1">{formattedTamilPagePreviewText}</p>
        </div>
        <div className="flex justify-between items-center">
          <Button type="button" onClick={handleCompileTamilPageNumber} className="w-full" disabled={!isTamilPageNumberValid}>
            <Play className="h-4 w-4 mr-2" /> Compile Page Number
          </Button>
          <Button
            type="button"
            onClick={handleAddTamilPageNumberToMain}
            className="w-full ml-2"
            disabled={!compiledTamilPageNumberObject}
          >
            <ListPlus className="h-4 w-4 mr-2" /> Add to Main Output
          </Button>
        </div>
        <ScrollArea className="h-24 w-full rounded-md border p-2 bg-secondary/20">
          <pre className="text-xs whitespace-pre-wrap break-all">
            {compiledTamilPageNumberObject ? JSON.stringify(compiledTamilPageNumberObject, null, 2) : "Compiled JSON will appear here."}
          </pre>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={handleClearTamilPageNumber}>
          <Trash2 className="h-4 w-4 mr-2" /> Clear Page Number
        </Button>
      </CardFooter>
    </Card>
  );
}