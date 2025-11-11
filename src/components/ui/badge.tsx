import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.08em] transition-[background-color,color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--color-primary))]",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))] text-white hover:bg-[hsl(var(--color-primary-light))] hover:border-[hsl(var(--color-primary-light))]",
        secondary:
          "border-[hsl(var(--color-light))] bg-[hsl(var(--color-light))] text-[hsl(var(--color-primary))] hover:border-[hsl(var(--color-primary))]/30 hover:bg-[hsl(var(--color-light))]/90",
        success:
          "border-[hsl(var(--color-success))] bg-[hsla(var(--color-success)/0.12)] text-[hsl(var(--color-success))]",
        warning:
          "border-[hsl(var(--color-warning))] bg-[hsla(var(--color-warning)/0.16)] text-[hsl(var(--color-warning))]",
        destructive:
          "border-[hsl(var(--color-error))] bg-[hsla(var(--color-error)/0.14)] text-[hsl(var(--color-error))]",
        outline: "border-[hsl(var(--border))] text-[hsl(var(--color-text))]",
        info:
          "border-[hsl(var(--color-info))] bg-[hsla(var(--color-info)/0.14)] text-[hsl(var(--color-info))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
