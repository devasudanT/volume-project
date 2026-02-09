import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';

interface HeadingInterfaceProps {
  headingText: string;
  setHeadingText: (text: string) => void;
  headingType: 'main' | 'sub';
  setHeadingType: (type: 'main' | 'sub') => void;
  selectedHeadingNumber: string;
  setSelectedHeadingNumber: (number: string) => void;
  onRunHeading: () => void;
}

const NO_HEADING_NUMBER_VALUE = "no-prefix";

export function HeadingInterface({
  headingText,
  setHeadingText,
  headingType,
  setHeadingType,
  selectedHeadingNumber,
  setSelectedHeadingNumber,
  onRunHeading
}: HeadingInterfaceProps) {
  const headingNumberOptions = Array.from({ length: 20 }, (_, i) => {
    const numStr = (i + 1).toString();
    return { value: numStr, label: numStr };
  });

  return (
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
        <Button onClick={onRunHeading} className="w-full" disabled={!headingText.trim()}>
          <Play className="mr-2 h-4 w-4" /> Run Heading
        </Button>
      </CardContent>
    </Card>
  );
}