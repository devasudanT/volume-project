import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';

interface ChapterInterfaceProps {
  selectedChapter: string;
  setSelectedChapter: (chapter: string) => void;
  onRunChapter: () => void;
}

export function ChapterInterface({ selectedChapter, setSelectedChapter, onRunChapter }: ChapterInterfaceProps) {
  const chapterOptions = Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    const numStr = num < 10 ? `0${num}` : `${num}`;
    return {
      idValue: `chapter-${numStr}`,
      displayLabel: `Chapter ${numStr}`
    };
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Chapter Selection</CardTitle>
        <CardDescription>Choose a chapter to generate its JSON structure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedChapter} onValueChange={setSelectedChapter}>
          <SelectTrigger>
            <SelectValue placeholder="Select a chapter" />
          </SelectTrigger>
          <SelectContent>
            {chapterOptions.map(option => (
              <SelectItem key={option.idValue} value={option.idValue}>
                {option.displayLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onRunChapter} className="w-full" disabled={!selectedChapter}>
          <Play className="mr-2 h-4 w-4" /> Run Chapter
        </Button>
      </CardContent>
    </Card>
  );
}