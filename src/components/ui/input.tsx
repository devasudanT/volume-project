import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onClick, ...props }, ref) => {
    const handleClick = async (e: React.MouseEvent<HTMLInputElement>) => {
      if (!props.value && props.placeholder) {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            const event = {
              target: { value: text },
            } as React.ChangeEvent<HTMLInputElement>;
            props.onChange?.(event);
          }
        } catch (err) {
          console.error("Failed to auto-paste:", err);
        }
      }
      onClick?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
