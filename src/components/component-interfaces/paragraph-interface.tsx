import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, XCircle, Combine, ListPlus } from 'lucide-react';

interface ParagraphContentItem {
  type: 'text' | 'bold' | 'italic' | 'eng_page' | 'verse' | 'word';
  value: string;
  link?: string;
}

interface ParagraphData {
  type: "paragraph";
  id: string;
  content: ParagraphContentItem[];
}

interface ParagraphInterfaceProps {
  selectedVolume: string;
  setSelectedVolume: (volume: string) => void;
  selectedParagraphChapter: string;
  setSelectedParagraphChapter: (chapter: string) => void;
  customParagraphId: string;
  setCustomParagraphId: (id: string) => void;
  plainTextInput: string;
  setPlainTextInput: (text: string) => void;
  boldTextInput: string;
  setBoldTextInput: (text: string) => void;
  italicTextInput: string;
  setItalicTextInput: (text: string) => void;
  engRefTextInput: string;
  setEngRefTextInput: (text: string) => void;
  verseRefTextInput: string;
  setVerseRefTextInput: (text: string) => void;
  englishWordTextInput: string;
  setEnglishWordTextInput: (text: string) => void;
  currentParagraphSnippets: ParagraphContentItem[];
  setCurrentParagraphSnippets: (snippets: ParagraphContentItem[]) => void;
  compiledParagraphDisplayJson: string;
  finalCompiledParagraphObject: ParagraphData | null;
  onAddSnippet: (type: ParagraphContentItem['type'], value: string, clearInput: () => void, link?: string) => void;
  onCompileParagraph: () => void;
  onAddParagraphToMain: () => void;
}

export function ParagraphInterface({
  selectedVolume,
  setSelectedVolume,
  selectedParagraphChapter,
  setSelectedParagraphChapter,
  customParagraphId,
  setCustomParagraphId,
  plainTextInput,
  setPlainTextInput,
  boldTextInput,
  setBoldTextInput,
  italicTextInput,
  setItalicTextInput,
  engRefTextInput,
  setEngRefTextInput,
  verseRefTextInput,
  setVerseRefTextInput,
  englishWordTextInput,
  setEnglishWordTextInput,
  currentParagraphSnippets,
  setCurrentParagraphSnippets,
  compiledParagraphDisplayJson,
  finalCompiledParagraphObject,
  onAddSnippet,
  onCompileParagraph,
  onAddParagraphToMain
}: ParagraphInterfaceProps) {
  const volumeOptions = Array.from({ length: 7 }, (_, i) => {
    const num = i + 1;
    return {
      idValue: `v${num}`,
      displayLabel: `Volume ${num < 10 ? `0${num}` : `${num}`}`
    };
  });

  const chapterOptions = Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    const numStr = num < 10 ? `0${num}` : `${num}`;
    return {
      idValue: `c${numStr}`,
      displayLabel: `Chapter ${numStr}`
    };
  });

  const paragraphFields = [
    {label: 'Plain Text', value: plainTextInput, setter: setPlainTextInput, type: 'text' as ParagraphContentItem['type']},
    {label: 'Bold Text', value: boldTextInput, setter: setBoldTextInput, type: 'bold' as ParagraphContentItem['type']},
    {label: 'Italic Text', value: italicTextInput, setter: setItalicTextInput, type: 'italic' as ParagraphContentItem['type']},
    {label: 'English Book Page Number', value: engRefTextInput, setter: setEngRefTextInput, type: 'eng_page' as ParagraphContentItem['type']},
    {label: 'Verse Reference', value: verseRefTextInput, setter: setVerseRefTextInput, type: 'verse' as ParagraphContentItem['type']},
    {label: 'English Word', value: englishWordTextInput, setter: setEnglishWordTextInput, type: 'word' as ParagraphContentItem['type']},
  ];

  const plainTextField = paragraphFields.find(field => field.type === 'text');
  const otherFields = paragraphFields.filter(field => field.type !== 'text');

  const formatCustomId = (num: string) => {
    const parsedNum = parseInt(num, 10);
    if (isNaN(parsedNum)) return '';
    return String(parsedNum).padStart(3, '0');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Paragraph Snippet Compiler</CardTitle>
        <CardDescription>Build a paragraph JSON object from text snippets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {plainTextField && (
          <div key={plainTextField.type} className="space-y-2">
            <Label htmlFor={`snippet-${plainTextField.type}`}>{plainTextField.label}</Label>
            <div className="flex items-center gap-2">
              <Textarea
                id={`snippet-${plainTextField.type}`}
                placeholder={`Enter ${plainTextField.label.toLowerCase()}`}
                value={plainTextField.value}
                onChange={(e) => plainTextField.setter(e.target.value)}
                rows={6}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => onAddSnippet(plainTextField.type, plainTextField.value, () => plainTextField.setter(''))}
                disabled={!plainTextField.value.trim()}
                aria-label={`Add ${plainTextField.label}`}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => plainTextField.setter('')}
                disabled={!plainTextField.value.trim()}
                aria-label={`Clear ${plainTextField.label}`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherFields.map(field => (
            <div key={field.type} className="space-y-2">
              <Label htmlFor={`snippet-${field.type}`}>{field.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`snippet-${field.type}`}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onAddSnippet(field.type, field.value, () => field.setter(''), field.type === 'verse' ? `#` : undefined)}
                  disabled={!field.value.trim()}
                  aria-label={`Add ${field.label}`}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => field.setter('')}
                  disabled={!field.value.trim()}
                  aria-label={`Clear ${field.label}`}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex justify-between items-center">
            <Label>Current Snippets for Paragraph:</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentParagraphSnippets([])}
              disabled={currentParagraphSnippets.length === 0}
            >
              Clear All
            </Button>
          </div>
          <ScrollArea className="h-24 w-full rounded-md border p-2 bg-secondary/20">
            {currentParagraphSnippets.length > 0 ? (
              currentParagraphSnippets.map((snippet, index) => (
                <div key={index} className="text-xs p-1 bg-background my-1 rounded border border-input">
                  <strong>{snippet.type}:</strong> {snippet.value}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No snippets added yet.</p>
            )}
          </ScrollArea>
        </div>

        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <Label htmlFor="volume-select">Volume</Label>
            <Select value={selectedVolume} onValueChange={setSelectedVolume}>
              <SelectTrigger id="volume-select">
                <SelectValue placeholder="Select Volume" />
              </SelectTrigger>
              <SelectContent>
                {volumeOptions.map(option => (
                  <SelectItem key={option.idValue} value={option.idValue}>
                    {option.displayLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="paragraph-chapter-select">Chapter</Label>
            <Select value={selectedParagraphChapter} onValueChange={setSelectedParagraphChapter}>
              <SelectTrigger id="paragraph-chapter-select">
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapterOptions.map(option => (
                  <SelectItem key={option.idValue} value={option.idValue}>
                    {option.displayLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="custom-paragraph-id">Custom ID</Label>
            <Input
              id="custom-paragraph-id"
              placeholder="e.g., 1 (becomes 001)"
              value={customParagraphId}
              onChange={(e) => setCustomParagraphId(e.target.value)}
              maxLength={3}
            />
          </div>
        </div>

        <Button onClick={onCompileParagraph} className="w-full" disabled={!selectedVolume || !selectedParagraphChapter || !customParagraphId.trim() || currentParagraphSnippets.length === 0}>
          <Combine className="mr-2 h-4 w-4" /> Compile Code
        </Button>

        <div>
          <Label htmlFor="compiled-paragraph-output">Paragraph Final Compiled Code</Label>
          <Textarea
            id="compiled-paragraph-output"
            readOnly
            value={compiledParagraphDisplayJson || "Compile to see output..."}
            rows={5}
            className="bg-secondary/30"
          />
        </div>
        <Button onClick={onAddParagraphToMain} className="w-full" disabled={!finalCompiledParagraphObject}>
          <ListPlus className="mr-2 h-4 w-4" /> Add to Main Output
        </Button>
      </CardContent>
    </Card>
  );
}