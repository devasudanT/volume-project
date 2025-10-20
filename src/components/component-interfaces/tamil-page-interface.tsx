import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, ListPlus, Trash2, BookCopy } from 'lucide-react';

interface PageData {
  type: "page";
  value: string;
  id: string;
}

interface TamilPageInterfaceProps {
  tamilPageNumberInput: string;
  setTamilPageNumberInput: (input: string) => void;
  compiledTamilPageNumberObject: PageData | null;
  onCompileTamilPageNumber: () => void;
  onAddTamilPageNumberToMain: () => void;
  onClearTamilPageNumber: () => void;
}

export function TamilPageInterface({
  tamilPageNumberInput,
  setTamilPageNumberInput,
  compiledTamilPageNumberObject,
  onCompileTamilPageNumber,
  onAddTamilPageNumberToMain,
  onClearTamilPageNumber
}: TamilPageInterfaceProps) {
  const handleTamilPageNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/\D/g, '');
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

  const formattedTamilPagePreviewText = getFormattedTamilPagePreview(tamilPageNumberInput);
  const isTamilPageNumberValid = (() => {
    const num = parseInt(tamilPageNumberInput, 10);
    return !isNaN(num) && num >= 1 && num <= 1000;
  })();

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
          <Button type="button" onClick={onCompileTamilPageNumber} className="w-full" disabled={!isTamilPageNumberValid}>
            <Play className="h-4 w-4 mr-2" /> Compile Page Number
          </Button>
          <Button
            type="button"
            onClick={onAddTamilPageNumberToMain}
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
        <Button variant="outline" onClick={onClearTamilPageNumber}>
          <Trash2 className="h-4 w-4 mr-2" /> Clear Page Number
        </Button>
      </CardFooter>
    </Card>
  );
}