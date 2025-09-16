"use client";

import type React from 'react';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Play, Download, Copy, Trash2, PlusCircle, XCircle, Combine, ListPlus, BookText, FileImage, FileText, Upload, Undo2 } from 'lucide-react';
import { TamilPageNumberCompiler } from "@/components/tamil-page-number-compiler";

interface OldJsonEntry { // This interface might still be useful for understanding the structure of non-paragraph items
  type: string;
  value: string;
  id: string;
  headingType?: 'main' | 'sub';
}

interface ParagraphContentItem {
type: 'text' | 'bold' | 'italic' | 'eng_page' | 'verse' | 'word';
  value: string;
  link?: string; // Optional link for verse references
}

interface ParagraphData {
  type: "paragraph";
  id: string;
  content: ParagraphContentItem[];
}

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

interface ImageData {
  type: "image";
  src: string;
}

interface PageData {
  type: "page";
  value: string;
  id: string;
}

interface FooterPassageData {
  type: "footer_passage";
  id: string;
  value: string;
}


const NO_HEADING_NUMBER_VALUE = "no-prefix";

export default function JsonCompilerPage() {
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [headingText, setHeadingText] = useState<string>('');
  const [headingType, setHeadingType] = useState<'main' | 'sub'>('main');
  const [selectedHeadingNumber, setSelectedHeadingNumber] = useState<string>('');
  const [hintText, setHintText] = useState<string>('');

  const [jsonOutputs, setJsonOutputs] = useState<string[]>([]); // Stores stringified JSON objects

  const [mainHeadingCount, setMainHeadingCount] = useState<number>(0);
  const [subHeadingCount, setSubHeadingCount] = useState<number>(0);
  const [hintCount, setHintCount] = useState<number>(0);

  // Paragraph Snippet States
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedParagraphChapter, setSelectedParagraphChapter] = useState<string>(''); // Renamed to avoid conflict
  const [customParagraphId, setCustomParagraphId] = useState<string>('');
  const [plainTextInput, setPlainTextInput] = useState<string>('');
  const [boldTextInput, setBoldTextInput] = useState<string>('');
  const [italicTextInput, setItalicTextInput] = useState<string>('');
  const [engRefTextInput, setEngRefTextInput] = useState<string>('');
  const [verseRefTextInput, setVerseRefTextInput] = useState<string>('');
  const [englishWordTextInput, setEnglishWordTextInput] = useState<string>('');
  const [currentParagraphSnippets, setCurrentParagraphSnippets] = useState<ParagraphContentItem[]>([]);
  const [compiledParagraphDisplayJson, setCompiledParagraphDisplayJson] = useState<string>('');
  const [finalCompiledParagraphObject, setFinalCompiledParagraphObject] = useState<ParagraphData | null>(null);

  // Poem Snippet States
  const [poemId, setPoemId] = useState<string>('');
  const [poemTitle, setPoemTitle] = useState<string>('');
  const [poemText, setPoemText] = useState<string>('');

  // Image Snippet States
  const [imageUrlInput, setImageUrlInput] = useState<string>('');

  // Footer Passage Snippet States
  const [footerPassageIdInput, setFooterPassageIdInput] = useState<string>('');
  const [footerPassageTextInput, setFooterPassageTextInput] = useState<string>('');

  const { toast } = useToast();


  const handleRunChapter = () => {
    if (!selectedChapter) {
      toast({ title: "Error", description: "Please select a chapter.", variant: "destructive" });
      return;
    }
    const chapterNumberString = selectedChapter.replace('chapter-', '');
    const chapterDisplayName = `அத்தியாயம் – ${chapterNumberString}`;

    const chapterObj = {
      type: "chapter",
      value: chapterDisplayName,
      id: selectedChapter
    };
    setJsonOutputs(prev => [...prev, JSON.stringify(chapterObj, null, 2)]);
    toast({ title: "Chapter Added", description: `${chapterObj.value} JSON generated.` });
  };

  const handleRunHeading = () => {
    if (!headingText.trim()) {
      toast({ title: "Error", description: "Heading text cannot be empty.", variant: "destructive" });
      return;
    }

    let newId: string;
    let newCount: number;
    let entryHeadingType: 'main' | 'sub' = headingType;

    if (headingType === 'main') {
      newCount = mainHeadingCount + 1;
      setMainHeadingCount(newCount);
      newId = `main-heading-${newCount}`;
    } else {
      newCount = subHeadingCount + 1;
      setSubHeadingCount(newCount);
      newId = `sub-heading-${newCount}`;
    }

    let outputValue = headingText.trim();
    if (selectedHeadingNumber && selectedHeadingNumber !== NO_HEADING_NUMBER_VALUE) {
      outputValue = `${selectedHeadingNumber}. ${outputValue}`;
    }

    const headingObj = {
      type: "heading",
      value: outputValue,
      id: newId,
      headingType: entryHeadingType
    };
    setJsonOutputs(prev => [...prev, JSON.stringify(headingObj, null, 2)]);
    setHeadingText('');
    setSelectedHeadingNumber('');
    toast({ title: "Heading Added", description: `JSON for "${headingObj.value}" generated.` });
  };

  const handleRunHints = () => {
    if (!hintText.trim()) {
      toast({ title: "Error", description: "Hints text cannot be empty.", variant: "destructive" });
      return;
    }
    const newCount = hintCount + 1;
    setHintCount(newCount);
    const hintObj = {
      type: "hints",
      value: hintText.trim(),
      id: `hints-${newCount}`
    };
    setJsonOutputs(prev => [...prev, JSON.stringify(hintObj, null, 2)]);
    setHintText('');
    toast({ title: "Hint Added", description: `Hint JSON generated.` });
  };

  // Paragraph Snippet Handlers
  const formatCustomId = (num: string) => {
    const parsedNum = parseInt(num, 10);
    if (isNaN(parsedNum)) return '';
    return String(parsedNum).padStart(3, '0');
  };

  const handleAddSnippet = (type: ParagraphContentItem['type'], value: string, clearInput: () => void, link?: string) => {
    if (!value.trim()) {
      toast({ title: "Error", description: "Snippet text cannot be empty.", variant: "destructive" });
      return;
    }
    let processedValue = value.trim();
    let snippet: ParagraphContentItem;

    if (type === 'verse') {
      snippet = { type, value: processedValue, link: link || "" }; // Ensure link is always a string
    } else {
      snippet = { type, value: processedValue };
    }

    setCurrentParagraphSnippets(prev => [...prev, snippet]);
    clearInput();
    toast({ title: "Snippet Added", description: `${type.charAt(0).toUpperCase() + type.slice(1)} snippet added to paragraph.` });
  };

  const handleCompileParagraph = () => {
    if (!selectedVolume || !selectedParagraphChapter || !customParagraphId.trim()) {
      toast({ title: "Error", description: "Please select Volume, Chapter, and enter a Custom ID.", variant: "destructive" });
      return;
    }
    if (currentParagraphSnippets.length === 0) {
      toast({ title: "Error", description: "Add at least one snippet to compile.", variant: "destructive" });
      return;
    }

    const formattedCustomId = formatCustomId(customParagraphId);
    if (!formattedCustomId) {
      toast({ title: "Error", description: "Custom ID must be a valid number.", variant: "destructive" });
      return;
    }

    const generatedParagraphId = `${selectedVolume}-${selectedParagraphChapter}-${formattedCustomId}`;

    const compiledObject: ParagraphData = {
      type: "paragraph",
      id: generatedParagraphId,
      content: currentParagraphSnippets
    };

    try {
      const jsonString = JSON.stringify(compiledObject, null, 2);
      if (typeof jsonString === 'string') {
        setFinalCompiledParagraphObject(compiledObject); // Set this first
        setCompiledParagraphDisplayJson(jsonString);      // Then this
        toast({ title: "Paragraph Compiled", description: `Paragraph "${compiledObject.id}" ready.` });
      } else {
        setFinalCompiledParagraphObject(null);
        setCompiledParagraphDisplayJson("Error: Could not generate JSON string (stringify returned non-string).");
        toast({ title: "Compilation Error", description: "Could not generate the paragraph JSON. Check console.", variant: "destructive"});
        console.error("Error: JSON.stringify returned non-string for paragraph object:", compiledObject);
      }
    } catch (error) {
      setFinalCompiledParagraphObject(null);
      setCompiledParagraphDisplayJson("Error: Could not generate JSON string (exception).");
      toast({ title: "Compilation Error", description: "Could not generate the paragraph JSON. Check console for details.", variant: "destructive"});
      console.error("Error stringifying paragraph object:", error);
    }
  };

  const handleAddParagraphToMain = () => {
    if (!finalCompiledParagraphObject) {
      toast({ title: "Error", description: "Compile a paragraph first.", variant: "destructive" });
      return;
    }
    setJsonOutputs(prev => [...prev, JSON.stringify(finalCompiledParagraphObject, null, 2)]);
    toast({ title: "Paragraph Added", description: `Paragraph "${finalCompiledParagraphObject.id}" added to main output.` });

    // Keep selectedVolume and selectedParagraphChapter intact as per new requirement
    setPlainTextInput('');
    setBoldTextInput('');
    setItalicTextInput('');
    setEngRefTextInput('');
    setVerseRefTextInput('');
    setCurrentParagraphSnippets([]);
    setCompiledParagraphDisplayJson('');
    setFinalCompiledParagraphObject(null);
  };

  // Poem Snippet Handler
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

  // Image Snippet Handler
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

  // Footer Passage Snippet Handler
  const handleAddFooterPassageToMain = () => {
    const trimmedFooterPassageId = footerPassageIdInput.trim();
    const trimmedFooterPassageText = footerPassageTextInput.trim();

    if (!trimmedFooterPassageId) {
      toast({ title: "Error", description: "Footer Passage ID cannot be empty.", variant: "destructive" });
      return;
    }
    if (!trimmedFooterPassageText) {
      toast({ title: "Error", description: "Footer Passage Text cannot be empty.", variant: "destructive" });
      return;
    }

    const footerPassageObject: FooterPassageData = {
      type: "footer_passage",
      id: trimmedFooterPassageId,
      value: trimmedFooterPassageText,
    };

    try {
      const jsonString = JSON.stringify(footerPassageObject, null, 2);
      setJsonOutputs(prev => [...prev, jsonString]);
      toast({ title: "Footer Passage Added", description: `Footer Passage "${footerPassageObject.id}" added to main output.` });

      setFooterPassageIdInput('');
      setFooterPassageTextInput('');
    } catch (error)
      {
      console.error("Error stringifying footer passage object:", error);
      toast({ title: "Compilation Error", description: "Could not generate the footer passage JSON. Check console.", variant: "destructive"});
    }
  };


  const handleDownloadJson = () => {
    if (jsonOutputs.length === 0) {
      toast({ title: "Nothing to download", description: "Generate some JSON first." });
      return;
    }
    try {
      const objectsArray = jsonOutputs.map(str => JSON.parse(str));
      const jsonString = JSON.stringify(objectsArray, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compiled_output.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "JSON file download started." });
    } catch (error) {
      toast({ title: "Download Error", description: "Could not prepare JSON for download.", variant: "destructive" });
      console.error("Download error:", error);
    }
  };

  const handleCopyJson = async () => {
    if (jsonOutputs.length === 0) {
      toast({ title: "Nothing to copy", description: "Generate some JSON first." });
      return;
    }
    try {
      const objectsArray = jsonOutputs.map(str => JSON.parse(str));
      const jsonString = JSON.stringify(objectsArray, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast({ title: "Copied!", description: "JSON output copied to clipboard." });
    } catch (err) {
      toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" });
      console.error('Failed to copy: ', err);
    }
  };

  const handleClearAll = () => {
    setSelectedChapter('');
    setHeadingText('');
    setHeadingType('main');
    setSelectedHeadingNumber('');
    setHintText('');
    setJsonOutputs([]);
    setMainHeadingCount(0);
    setSubHeadingCount(0);
    setHintCount(0);

    setSelectedVolume('');
    setSelectedParagraphChapter('');
    setCustomParagraphId('');
    setPlainTextInput('');
    setBoldTextInput('');
    setItalicTextInput('');
    setEngRefTextInput('');
    setVerseRefTextInput('');
    setEnglishWordTextInput('');
    setCurrentParagraphSnippets([]);
    setCompiledParagraphDisplayJson('');
    setFinalCompiledParagraphObject(null);

    setPoemId('');
    setPoemTitle('');
    setPoemText('');

    setImageUrlInput('');

    setFooterPassageIdInput('');
    setFooterPassageTextInput('');


    toast({ title: "Cleared", description: "All inputs and outputs have been cleared." });
  };

  const handleUndo = () => {
    setJsonOutputs(prev => {
      if (prev.length > 0) {
        const newOutputs = prev.slice(0, prev.length - 1);
        toast({ title: "Undo Successful", description: "Most recent JSON snippet removed." });
        return newOutputs;
      }
      toast({ title: "Nothing to undo", description: "No JSON snippets to remove." });
      return prev;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "Error", description: "No file selected.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const uploadedData = JSON.parse(content);

        if (!Array.isArray(uploadedData)) {
          toast({ title: "Error", description: "Uploaded JSON is not an array. Please upload a valid snippets array.", variant: "destructive" });
          return;
        }

        const newOutputs = uploadedData.map(item => {
          if (typeof item !== 'object' || item === null || !item.type) {
            throw new Error("Invalid snippet: Missing 'type' property.");
          }

          // Validate common required fields
          if (!item.id && item.type !== 'image') { // Image type does not require an 'id'
            throw new Error(`Invalid snippet of type '${item.type}': Missing 'id' property.`);
          }

          // Validate specific required fields based on type
          switch (item.type) {
            case 'chapter':
            case 'heading':
            case 'hints':
            case 'page':
            case 'footer_passage':
              if (!item.value) {
                throw new Error(`Invalid snippet of type '${item.type}': Missing 'value' property.`);
              }
              break;
            case 'paragraph':
              if (!item.content || !Array.isArray(item.content) || item.content.length === 0) {
                throw new Error(`Invalid snippet of type 'paragraph': Missing or empty 'content' array.`);
              }
              // Further validate content items if necessary, e.g., item.content.every(c => c.type && c.value)
              break;
            case 'poem':
              if (!item.title || !item.lines || !Array.isArray(item.lines) || item.lines.length === 0) {
                throw new Error(`Invalid snippet of type 'poem': Missing 'title' or empty 'lines' array.`);
              }
              // Further validate lines if necessary, e.g., item.lines.every(line => line.type === 'line' && line.value)
              break;
            case 'image':
              if (!item.src) {
                throw new Error(`Invalid snippet of type 'image': Missing 'src' property.`);
              }
              break;
            default:
              // For any unknown types, we can still enforce basic id/type check or throw an error
              console.warn(`Unknown snippet type encountered: ${item.type}. Basic validation applied.`);
              break;
          }
          return JSON.stringify(item, null, 2);
        });

        setJsonOutputs(prev => [...prev, ...newOutputs]);
        toast({ title: "Upload Successful", description: `${newOutputs.length} snippets loaded from file.` });

      } catch (error) {
        toast({ title: "Upload Error", description: `Failed to parse or validate JSON: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
        console.error("File upload error:", error);
      } finally {
        // Clear the file input to allow re-uploading the same file
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const displayedJson = useMemo(() => {
    if (jsonOutputs.length === 0) return "No JSON generated yet.";
    try {
      const objectsArray = jsonOutputs.map(str => JSON.parse(str)); // Parse only if necessary
      return JSON.stringify(objectsArray, null, 2);
    } catch (error) {
      console.error("Error parsing JSON outputs for display:", error);
      return "Error displaying JSON. Check console.";
    }
  }, [jsonOutputs]);

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
      idValue: `c${numStr}`, // Changed to 'cXX' for paragraph ID
      displayLabel: `Chapter ${numStr}`
    };
  });

  const headingNumberOptions = Array.from({ length: 20 }, (_, i) => {
    const numStr = (i + 1).toString();
    return { value: numStr, label: numStr };
  });

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Volume Project</h1>
        <p className="text-muted-foreground mt-2">Visually compile JSON snippets and combine them.</p>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          {/* Chapter Selection Card */}
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
              <Button onClick={handleRunChapter} className="w-full" disabled={!selectedChapter}>
                <Play className="mr-2 h-4 w-4" /> Run Chapter
              </Button>
            </CardContent>
          </Card>

          {/* Heading Generation Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Heading Generation</CardTitle>
              <CardDescription>Input heading text, select type, and optionally a number.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1 block">Heading Type</Label>
                  <RadioGroup
                    defaultValue="main"
                    value={headingType}
                    onValueChange={(value: 'main' | 'sub') => setHeadingType(value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="main" id="main-heading" />
                      <Label htmlFor="main-heading" className="font-normal">Main</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sub" id="sub-heading" />
                      <Label htmlFor="sub-heading" className="font-normal">Sub</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="heading-number-select" className="mb-1 block">Heading Number (Opt.)</Label>
                  <Select
                    value={selectedHeadingNumber || NO_HEADING_NUMBER_VALUE}
                    onValueChange={(value) => {
                      setSelectedHeadingNumber(value === NO_HEADING_NUMBER_VALUE ? "" : value);
                    }}
                  >
                    <SelectTrigger id="heading-number-select">
                      <SelectValue placeholder="Select #" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_HEADING_NUMBER_VALUE}>None</SelectItem>
                      {headingNumberOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="heading-text">Heading Text</Label>
                <Input
                  id="heading-text"
                  placeholder="Enter heading text"
                  value={headingText}
                  onChange={(e) => setHeadingText(e.target.value)}
                />
              </div>
              <Button onClick={handleRunHeading} className="w-full" disabled={!headingText.trim()}>
                <Play className="mr-2 h-4 w-4" /> Run Heading
              </Button>
            </CardContent>
          </Card>

          {/* Hints Generation Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Hints Generation</CardTitle>
              <CardDescription>Input hint text to generate its JSON structure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hint-text">Hint Text</Label>
                <Textarea
                  id="hint-text"
                  placeholder="Enter hint text"
                  value={hintText}
                  onChange={(e) => setHintText(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleRunHints} className="w-full" disabled={!hintText.trim()}>
                <Play className="mr-2 h-4 w-4" /> Run Hint
              </Button>
            </CardContent>
          </Card>

          {/* Paragraph Snippet Compiler Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Paragraph Snippet Compiler</CardTitle>
              <CardDescription>Build a paragraph JSON object from text snippets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
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

                return (
                  <>
                    {plainTextField && (
                      <div key={plainTextField.type} className="space-y-2">
                        <Label htmlFor={`snippet-${plainTextField.type}`}>{plainTextField.label}</Label>
                        <div className="flex items-center gap-2">
                          <Textarea
                            id={`snippet-${plainTextField.type}`}
                            placeholder={`Enter ${plainTextField.label.toLowerCase()}`}
                            value={plainTextField.value}
                            onChange={(e) => plainTextField.setter(e.target.value)}
                            rows={6} // Increased height for plain text
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddSnippet(plainTextField.type, plainTextField.value, () => plainTextField.setter(''))}
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
                              onClick={() => handleAddSnippet(field.type, field.value, () => field.setter(''), field.type === 'verse' ? `#` : undefined)}
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
                  </>
                );
              })()}

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
                    maxLength={3} // Max 3 digits for input
                  />
                </div>
              </div>

              <Button onClick={handleCompileParagraph} className="w-full" disabled={!selectedVolume || !selectedParagraphChapter || !customParagraphId.trim() || currentParagraphSnippets.length === 0}>
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
              <Button onClick={handleAddParagraphToMain} className="w-full" disabled={!finalCompiledParagraphObject}>
                <ListPlus className="mr-2 h-4 w-4" /> Add to Main Output
              </Button>
            </CardContent>
          </Card>

          {/* Tamil Book Page Number Snippet Compiler Card */}
          <TamilPageNumberCompiler setJsonOutputs={setJsonOutputs} />

          {/* Poem Snippet Compiler Card */}
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

          {/* Image Snippet Compiler Card */}
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

          {/* Footer Passage Snippet Compiler Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Footer Passage Snippet Compiler
              </CardTitle>
              <CardDescription>Enter footer passage ID and text to generate its JSON structure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footer-passage-id-input">Footer Passage ID</Label>
                <Input
                  id="footer-passage-id-input"
                  placeholder="Enter footer passage ID (e.g., footer-passage-1)"
                  value={footerPassageIdInput}
                  onChange={(e) => setFooterPassageIdInput(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="footer-passage-text-input">Footer Passage Text</Label>
                <Textarea
                  id="footer-passage-text-input"
                  placeholder="Enter footer passage text..."
                  value={footerPassageTextInput}
                  onChange={(e) => setFooterPassageTextInput(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleAddFooterPassageToMain} className="w-full" disabled={!footerPassageIdInput.trim() || !footerPassageTextInput.trim()}>
                <ListPlus className="mr-2 h-4 w-4" /> Add to Main Output
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* JSON Output Display Card */}
        <div className="sticky top-8">
          <Card className="shadow-lg flex flex-col max-h-[calc(100vh-8rem)] h-full overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline flex items-center justify-between">
                <span>JSON Output</span>
                <div className="flex items-center gap-2">
                  <Input
                    id="json-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Label htmlFor="json-upload" className="cursor-pointer">
                    <Button asChild variant="outline" size="sm">
                      <span><Upload className="mr-2 h-4 w-4" /> Upload JSON</span>
                    </Button>
                  </Label>
                </div>
              </CardTitle>
              <CardDescription>Generated JSON objects will appear here in order.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 flex-1 min-h-0 flex flex-col">
              <ScrollArea className="relative w-full rounded-md border p-4 bg-secondary/30 flex-1 min-h-0 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap break-all">
                  {displayedJson}
                </pre>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={handleDownloadJson} variant="outline" className="flex-1" disabled={jsonOutputs.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Download JSON
              </Button>
              <Button onClick={handleCopyJson} variant="outline" className="flex-1" disabled={jsonOutputs.length === 0}>
                <Copy className="mr-2 h-4 w-4" /> Copy Code
              </Button>
              <Button onClick={handleUndo} variant="outline" className="flex-1" disabled={jsonOutputs.length === 0}>
                <Undo2 className="mr-2 h-4 w-4" /> Undo
              </Button>
              <Button
                onClick={handleClearAll}
                variant="destructive"
                className="flex-1"
                disabled={
                  jsonOutputs.length === 0 &&
                  !selectedChapter &&
                  !headingText &&
                  !hintText &&
                  !selectedHeadingNumber &&
                  !selectedVolume &&
                  !selectedParagraphChapter &&
                  !customParagraphId &&
                  currentParagraphSnippets.length === 0 &&
                  !finalCompiledParagraphObject &&
                  !poemId &&
                  !poemTitle &&
                  !poemText &&
                  !imageUrlInput &&
                  !footerPassageIdInput &&
                  !footerPassageTextInput
                }
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
