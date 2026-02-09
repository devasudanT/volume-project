import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';

interface HintsInterfaceProps {
  hintText: string;
  setHintText: (text: string) => void;
  onRunHints: () => void;
}

export function HintsInterface({ hintText, setHintText, onRunHints }: HintsInterfaceProps) {
  return (
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
        <Button onClick={onRunHints} className="w-full" disabled={!hintText.trim()}>
          <Play className="mr-2 h-4 w-4" /> Run Hint
        </Button>
      </CardContent>
    </Card>
  );
}