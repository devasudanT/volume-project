import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, onClick, ...props }, ref) => {
    const handleClick = async (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!props.value && props.placeholder) {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            const event = {
              target: { value: text },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            props.onChange?.(event);
          }
        } catch (err) {
          console.error('Failed to auto-paste:', err);
        }
      }
      onClick?.(e);
    };

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
