import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-card p-5 pl-6 text-card-foreground shadow-brand-sm transition-brand [&>svg~*]:pl-8 [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-[hsl(var(--primary))]",
  {
    variants: {
      variant: {
        default: "border-l-4 border-l-[hsl(var(--primary))] bg-secondary/40",
        success:
          "border-l-4 border-l-[hsl(var(--success))] bg-[rgba(40,167,69,0.12)] [&>svg]:text-[hsl(var(--success))]",
        warning:
          "border-l-4 border-l-[hsl(var(--warning))] bg-[rgba(255,193,7,0.14)] [&>svg]:text-[hsl(var(--warning))]",
        info:
          "border-l-4 border-l-[hsl(var(--info))] bg-[rgba(4,69,141,0.14)] [&>svg]:text-[hsl(var(--info))]",
        destructive:
          "border-l-4 border-l-[hsl(var(--destructive))] bg-[rgba(220,53,69,0.12)] text-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(
        "mb-1 font-saira text-sm font-semibold uppercase tracking-[0.05em] text-current",
        className,
      )}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("font-neuton text-sm text-foreground/80 [&_p]:leading-relaxed", className)}
      {...props}
    />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
