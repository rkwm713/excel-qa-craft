import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-card px-6 py-5 text-card-foreground shadow-brand-sm transition-[box-shadow,transform] duration-200 ease-out [&>svg~*]:pl-9 [&>svg]:absolute [&>svg]:left-6 [&>svg]:top-5 [&>svg]:text-[hsl(var(--color-primary))]",
  {
    variants: {
      variant: {
        default:
          "border-l-4 border-l-[hsl(var(--color-primary))] bg-[hsla(var(--color-light)/0.8)] text-[hsl(var(--color-dark))]",
        success:
          "border-l-4 border-l-[hsl(var(--color-success))] bg-[hsl(134,41%,88%)] text-[hsl(134,61%,21%)] [&>svg]:text-[hsl(var(--color-success))]",
        warning:
          "border-l-4 border-l-[hsl(var(--color-warning))] bg-[hsl(46,100%,90%)] text-[hsl(45,94%,27%)] [&>svg]:text-[hsl(var(--color-warning))]",
        info:
          "border-l-4 border-l-[hsl(var(--color-info))] bg-[hsla(var(--color-info)/0.18)] text-[hsl(206,78%,18%)] [&>svg]:text-[hsl(var(--color-info))]",
        destructive:
          "border-l-4 border-l-[hsl(var(--color-error))] bg-[hsl(355,70%,91%)] text-[hsl(354,61%,28%)] [&>svg]:text-[hsl(var(--color-error))]",
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
      className={cn("font-neuton text-sm text-[hsl(var(--color-secondary))] [&_p]:leading-relaxed", className)}
      {...props}
    />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
