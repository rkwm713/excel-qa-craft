import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[var(--radius-sm)] border-2 border-[hsl(var(--border))] bg-background px-4 py-3 font-neuton text-base text-foreground shadow-brand-sm transition-brand placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-primary focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:shadow-[0_0_0_3px_rgba(4,69,141,0.12)] disabled:cursor-not-allowed disabled:border-[hsl(var(--muted))] disabled:bg-[hsl(var(--muted))] disabled:text-muted-foreground disabled:shadow-none file:border-0 file:bg-transparent file:font-saira file:uppercase file:tracking-[0.05em] file:text-xs file:text-foreground md:text-base",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
