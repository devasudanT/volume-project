import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComponentToolbarProps {
  activeComponent: string;
  onComponentChange: (component: string) => void;
}

const componentTypes = [
  {
    id: 'chapter',
    name: 'Chapter',
    icon: '📖',
    description: 'Select and generate chapter JSON'
  },
  {
    id: 'heading', 
    name: 'Heading',
    icon: '📝',
    description: 'Create main and sub-headings'
  },
  {
    id: 'hints',
    name: 'Hints', 
    icon: '💡',
    description: 'Add hint text snippets'
  },
  {
    id: 'paragraph',
    name: 'Paragraph',
    icon: '📄',
    description: 'Build paragraph from text snippets'
  },
  {
    id: 'tamil-page',
    name: 'Tamil Page',
    icon: '📑',
    description: 'Generate Tamil page numbers'
  },
  {
    id: 'table',
    name: 'Table',
    icon: '📊',
    description: 'Create visual tables'
  },
  {
    id: 'poem',
    name: 'Poem',
    icon: '📚',
    description: 'Compile poem snippets'
  },
  {
    id: 'image',
    name: 'Image',
    icon: '🖼️',
    description: 'Add image snippets'
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: '📋',
    description: 'Create footer passages'
  }
];

export function ComponentToolbar({ activeComponent, onComponentChange }: ComponentToolbarProps) {
  return (
    <div className="w-full bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Component Tools</h2>
          <span className="text-sm text-muted-foreground">
            {componentTypes.find(c => c.id === activeComponent)?.name} Active
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {componentTypes.map((component) => (
            <Button
              key={component.id}
              variant={activeComponent === component.id ? "default" : "outline"}
              size="sm"
              onClick={() => onComponentChange(component.id)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-3 px-4",
                activeComponent === component.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
              title={component.description}
            >
              <span className="text-lg">{component.icon}</span>
              <span className="text-xs font-medium">{component.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}