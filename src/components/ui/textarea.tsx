import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-[var(--radius-sm)] border-2 border-[hsl(var(--border))] bg-background px-4 py-3 font-neuton text-base text-foreground shadow-brand-sm transition-brand placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-primary focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:shadow-[0_0_0_3px_rgba(4,69,141,0.12)] disabled:cursor-not-allowed disabled:border-[hsl(var(--muted))] disabled:bg-[hsl(var(--muted))] disabled:text-muted-foreground disabled:shadow-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
