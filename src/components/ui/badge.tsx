import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.08em] transition-brand focus-visible:outline focus-visible:outline-primary focus-visible:outline-[3px] focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:border-[hsl(var(--primary-light))] hover:bg-[hsl(var(--primary-light))]",
        secondary:
          "border-[hsl(var(--secondary))] bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]/30 hover:bg-[hsl(var(--secondary))]/80",
        success:
          "border-[hsl(var(--success))] bg-[rgba(40,167,69,0.12)] text-[hsl(var(--success))]",
        warning:
          "border-[hsl(var(--warning))] bg-[rgba(255,193,7,0.12)] text-[hsl(var(--warning))]",
        destructive:
          "border-[hsl(var(--destructive))] bg-[rgba(220,53,69,0.12)] text-[hsl(var(--destructive))]",
        outline: "border-[hsl(var(--border))] text-foreground",
        info:
          "border-[hsl(var(--info))] bg-[rgba(4,69,141,0.12)] text-[hsl(var(--info))]",
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
