import { cn } from "@/lib/utils";
import primaryLogo from "@/assets/techserv-logo.png";
import primaryLogoWhite from "@/assets/techserv-logo-white.png";
import secondaryLogo from "@/assets/techserv-logo-secondary.png";
import secondaryLogoWhite from "@/assets/techserv-logo-secondary-white.png";
import logomark from "@/assets/techserv-logomark.png";
import logomarkWhite from "@/assets/techserv-logomark-white.png";

export type TechServLogoVariant = "primary" | "secondary" | "mark";

type LogoProps = {
  variant?: TechServLogoVariant;
  invert?: boolean;
  width?: number;
  className?: string;
};

const logoSources = {
  primary: {
    light: primaryLogo,
    dark: primaryLogoWhite,
  },
  secondary: {
    light: secondaryLogo,
    dark: secondaryLogoWhite,
  },
  mark: {
    light: logomark,
    dark: logomarkWhite,
  },
} as const;

const defaultWidths: Record<TechServLogoVariant, number> = {
  primary: 200,
  secondary: 72,
  mark: 40,
};

export const TechServLogo = ({
  variant = "primary",
  invert = false,
  width,
  className,
}: LogoProps) => {
  const sourceSet = logoSources[variant];
  const src = invert ? sourceSet.dark : sourceSet.light;
  const alt =
    variant === "secondary"
      ? "TechServ secondary logo"
      : variant === "mark"
        ? "TechServ logomark"
        : "TechServ primary logo";
  const resolvedWidth = width ?? defaultWidths[variant];

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-auto", className)}
      style={resolvedWidth ? { width: resolvedWidth } : undefined}
    />
  );
};

