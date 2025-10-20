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
import { Play, Download, Copy, Trash2, Upload, Undo2, PlusCircle, XCircle, Combine, ListPlus, BookText, FileImage, FileText } from 'lucide-react';
import { ComponentToolbar } from "@/components/component-toolbar";
import { ChapterInterface } from "@/components/component-interfaces/chapter-interface";
import { HeadingInterface } from "@/components/component-interfaces/heading-interface";
import { HintsInterface } from "@/components/component-interfaces/hints-interface";
import { ParagraphInterface } from "@/components/component-interfaces/paragraph-interface";
import { TamilPageInterface } from "@/components/component-interfaces/tamil-page-interface";
import { TableCompiler } from "@/components/component-interfaces/table-interface";
import { PoemInterface } from "@/components/component-interfaces/poem-interface";
import { ImageInterface } from "@/components/component-interfaces/image-interface";
import { FooterInterface } from "@/components/component-interfaces/footer-interface";
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
  const [activeComponent, setActiveComponent] = useState<string>('chapter');
  
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [headingText, setHeadingText] = useState<string>('');
  const [headingType, setHeadingType] = useState<'main' | 'sub'>('main');
  const [selectedHeadingNumber, setSelectedHeadingNumber] = useState<string>('');
  const [hintText, setHintText] = useState<string>('');

  const [jsonOutputs, setJsonOutputs] = useState<string[]>([]); // Stores stringified JSON objects

  const [mainHeadingCount, setMainHeadingCount] = useState<number>(0);
  const [subHeadingCount, setSubHeadingCount] = useState<number>(0);
  const [hintCount, setHintCount] = useState<number>(0);

  // Tamil Page Number States
  const [tamilPageNumberInput, setTamilPageNumberInput] = useState<string>('');
  const [compiledTamilPageNumberObject, setCompiledTamilPageNumberObject] = useState<PageData | null>(null);

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

  // Tamil Page Number Handlers
  const handleTamilPageNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/\D/g, '');
    setTamilPageNumberInput(filteredValue);
  };

  const handleCompileTamilPageNumber = () => {
    const num = parseInt(tamilPageNumberInput, 10);
    if (!tamilPageNumberInput || isNaN(num) || num < 1 || num > 1000) {
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

    // Tamil Page Number states
    setTamilPageNumberInput('');
    setCompiledTamilPageNumberObject(null);

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Volume Project</h1>
            <p className="text-muted-foreground mt-1">Visually compile JSON snippets and combine them.</p>
          </div>
        </div>
      </header>

      {/* Component Toolbar */}
      <ComponentToolbar
        activeComponent={activeComponent}
        onComponentChange={setActiveComponent}
      />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Component Interface Panel */}
          <div className="space-y-6">
            {activeComponent === 'chapter' && (
              <ChapterInterface
                selectedChapter={selectedChapter}
                setSelectedChapter={setSelectedChapter}
                onRunChapter={handleRunChapter}
              />
            )}
            {activeComponent === 'heading' && (
              <HeadingInterface
                headingText={headingText}
                setHeadingText={setHeadingText}
                headingType={headingType}
                setHeadingType={setHeadingType}
                selectedHeadingNumber={selectedHeadingNumber}
                setSelectedHeadingNumber={setSelectedHeadingNumber}
                onRunHeading={handleRunHeading}
              />
            )}
            {activeComponent === 'hints' && (
              <HintsInterface
                hintText={hintText}
                setHintText={setHintText}
                onRunHints={handleRunHints}
              />
            )}
            {activeComponent === 'paragraph' && (
              <ParagraphInterface
                selectedVolume={selectedVolume}
                setSelectedVolume={setSelectedVolume}
                selectedParagraphChapter={selectedParagraphChapter}
                setSelectedParagraphChapter={setSelectedParagraphChapter}
                customParagraphId={customParagraphId}
                setCustomParagraphId={setCustomParagraphId}
                plainTextInput={plainTextInput}
                setPlainTextInput={setPlainTextInput}
                boldTextInput={boldTextInput}
                setBoldTextInput={setBoldTextInput}
                italicTextInput={italicTextInput}
                setItalicTextInput={setItalicTextInput}
                engRefTextInput={engRefTextInput}
                setEngRefTextInput={setEngRefTextInput}
                verseRefTextInput={verseRefTextInput}
                setVerseRefTextInput={setVerseRefTextInput}
                englishWordTextInput={englishWordTextInput}
                setEnglishWordTextInput={setEnglishWordTextInput}
                currentParagraphSnippets={currentParagraphSnippets}
                setCurrentParagraphSnippets={setCurrentParagraphSnippets}
                compiledParagraphDisplayJson={compiledParagraphDisplayJson}
                finalCompiledParagraphObject={finalCompiledParagraphObject}
                onAddSnippet={handleAddSnippet}
                onCompileParagraph={handleCompileParagraph}
                onAddParagraphToMain={handleAddParagraphToMain}
              />
            )}
            {activeComponent === 'tamil-page' && (
              <TamilPageInterface
                tamilPageNumberInput={tamilPageNumberInput}
                setTamilPageNumberInput={setTamilPageNumberInput}
                compiledTamilPageNumberObject={compiledTamilPageNumberObject}
                onCompileTamilPageNumber={handleCompileTamilPageNumber}
                onAddTamilPageNumberToMain={handleAddTamilPageNumberToMain}
                onClearTamilPageNumber={handleClearTamilPageNumber}
              />
            )}
            {activeComponent === 'table' && (
              <TableCompiler setJsonOutputs={setJsonOutputs} />
            )}
            {activeComponent === 'poem' && (
              <PoemInterface
                poemId={poemId}
                setPoemId={setPoemId}
                poemTitle={poemTitle}
                setPoemTitle={setPoemTitle}
                poemText={poemText}
                setPoemText={setPoemText}
                setJsonOutputs={setJsonOutputs}
              />
            )}
            {activeComponent === 'image' && (
              <ImageInterface
                imageUrlInput={imageUrlInput}
                setImageUrlInput={setImageUrlInput}
                setJsonOutputs={setJsonOutputs}
              />
            )}
            {activeComponent === 'footer' && (
              <FooterInterface
                footerPassageIdInput={footerPassageIdInput}
                setFooterPassageIdInput={setFooterPassageIdInput}
                footerPassageTextInput={footerPassageTextInput}
                setFooterPassageTextInput={setFooterPassageTextInput}
                setJsonOutputs={setJsonOutputs}
              />
            )}
          </div>

          {/* JSON Output Display Panel */}
          <div className="sticky top-6">
            <Card className="shadow-lg flex flex-col max-h-[calc(100vh-12rem)] h-full overflow-hidden">
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
                    !footerPassageTextInput &&
                    !tamilPageNumberInput &&
                    !compiledTamilPageNumberObject
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear All
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
