import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border border-transparent font-saira font-semibold uppercase tracking-[0.05em] transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--color-primary))] motion-reduce:transform-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[hsl(var(--color-disabled))] disabled:text-[hsl(var(--color-secondary))] disabled:shadow-none disabled:translate-y-0 shadow-brand-sm will-change-transform [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))] text-white hover:-translate-y-0.5 hover:bg-[hsl(var(--color-primary-dark))] hover:border-[hsl(var(--color-primary-dark))] hover:shadow-brand-md active:translate-y-0 active:shadow-brand-sm",
        destructive:
          "border-[hsl(var(--color-error))] bg-[hsl(var(--color-error))] text-white hover:-translate-y-0.5 hover:bg-[hsl(var(--color-error))]/90 hover:shadow-brand-md active:translate-y-0",
        outline:
          "border-2 border-[hsl(var(--color-primary))] bg-transparent text-[hsl(var(--color-primary))] hover:-translate-y-0.5 hover:bg-[hsl(var(--color-primary))] hover:text-white active:translate-y-0",
        secondary:
          "border-2 border-[hsl(var(--color-primary))] bg-transparent text-[hsl(var(--color-primary))] hover:-translate-y-0.5 hover:bg-[hsl(var(--color-primary))] hover:text-white active:translate-y-0",
        ghost:
          "bg-transparent text-[hsl(var(--color-primary))] hover:bg-[hsla(var(--color-primary)/0.12)] hover:-translate-y-0.5 active:translate-y-0",
        link: "text-[hsl(var(--color-primary))] underline-offset-4 hover:underline",
        cta:
          "border-2 border-[hsl(var(--color-text))] bg-[hsl(var(--color-cta))] text-[hsl(var(--color-text))] hover:-translate-y-0.5 hover:bg-[hsl(60,100%,45%)] hover:shadow-brand-lg active:translate-y-0",
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
