import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] font-saira font-semibold uppercase tracking-[0.05em] transition-brand focus-visible:outline focus-visible:outline-primary focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60 shadow-brand-sm will-change-transform [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-brand-md hover:bg-[hsl(var(--primary-light))] active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:shadow-brand-md hover:bg-destructive/90 active:translate-y-0",
        outline:
          "border-2 border-primary text-primary bg-transparent hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground border border-primary/20 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-brand-md hover:bg-secondary/90 active:translate-y-0",
        ghost:
          "bg-transparent text-primary hover:bg-primary/10 hover:-translate-y-0.5 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline",
        cta:
          "bg-accent text-accent-foreground border-2 border-[hsl(var(--foreground))] hover:-translate-y-0.5 hover:bg-[#E6E600] hover:shadow-brand-lg active:translate-y-0",
      },
      size: {
        default: "min-h-[3rem] px-6 py-3 text-base",
        sm: "min-h-[2.5rem] px-4 py-2 text-sm",
        lg: "min-h-[3.5rem] px-8 py-4 text-lg",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
