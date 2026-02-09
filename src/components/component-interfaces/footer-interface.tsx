import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, ListPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface FooterPassageData {
  type: "footer_passage";
  id: string;
  value: string;
}

interface FooterInterfaceProps {
  footerPassageIdInput: string;
  setFooterPassageIdInput: (id: string) => void;
  footerPassageTextInput: string;
  setFooterPassageTextInput: (text: string) => void;
  setJsonOutputs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function FooterInterface({
  footerPassageIdInput,
  setFooterPassageIdInput,
  footerPassageTextInput,
  setFooterPassageTextInput,
  setJsonOutputs
}: FooterInterfaceProps) {
  const { toast } = useToast();

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
    } catch (error) {
      console.error("Error stringifying footer passage object:", error);
      toast({ title: "Compilation Error", description: "Could not generate the footer passage JSON. Check console.", variant: "destructive"});
    }
  };

  return (
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
  );
}