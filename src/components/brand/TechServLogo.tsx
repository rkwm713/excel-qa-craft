import { cn } from "@/lib/utils";
import primaryColor from "@/assets/TechServ_PrimaryLogo_Color.png";
import primaryWhite from "@/assets/TechServ_PrimaryLogo_White.png";
import primaryBlack from "@/assets/TechServ_PrimaryLogo_Black.png";
import primaryColorWhite from "@/assets/TechServ_PrimaryLogo_ColorWhite.png";
import secondaryColor from "@/assets/TechServ_SecondaryLogo_Color.png";
import secondaryWhite from "@/assets/TechServ_SecondaryLogo_White.png";
import secondaryBlack from "@/assets/TechServ_SecondaryLogo_Black.png";
import secondaryColorWhite from "@/assets/TechServ_SecondaryLogo_ColorWhite.png";
import logomark from "@/assets/techserv-logomark.png";
import logomarkWhite from "@/assets/techserv-logomark-white.png";

export type TechServLogoVariant = "primary" | "secondary" | "mark";
export type TechServLogoTone = "color" | "white" | "black" | "color-on-dark";

type LogoProps = {
  variant?: TechServLogoVariant;
  tone?: TechServLogoTone;
  /**
   * @deprecated Use the `tone` prop instead. `invert` will be removed in a future release.
   */
  invert?: boolean;
  width?: number;
  className?: string;
  minWidth?: number;
};

const logoSources: Record<TechServLogoVariant, Partial<Record<TechServLogoTone, string>>> = {
  primary: {
    color: primaryColor,
    white: primaryWhite,
    black: primaryBlack,
    "color-on-dark": primaryColorWhite,
  },
  secondary: {
    color: secondaryColor,
    white: secondaryWhite,
    black: secondaryBlack,
    "color-on-dark": secondaryColorWhite,
  },
  mark: {
    color: logomark,
    white: logomarkWhite,
  },
};

const defaultWidths: Record<TechServLogoVariant, number> = {
  primary: 200,
  secondary: 96,
  mark: 48,
};

const minimumWidths: Record<TechServLogoVariant, number> = {
  primary: 100,
  secondary: 80,
  mark: 32,
};

const describeLogo = (variant: TechServLogoVariant, tone: TechServLogoTone) => {
  const base =
    variant === "secondary"
      ? "TechServ secondary logo"
      : variant === "mark"
        ? "TechServ logomark"
        : "TechServ primary logo";

  switch (tone) {
    case "white":
      return `${base} in white`;
    case "black":
      return `${base} in black`;
    case "color-on-dark":
      return `${base} color-on-dark treatment`;
    default:
      return base;
  }
};

const resolveTone = (variant: TechServLogoVariant, tone: TechServLogoTone) => {
  const available = logoSources[variant][tone];
  if (available) {
    return { src: available, filter: undefined };
  }

  if (tone === "color-on-dark") {
    const fallback = logoSources[variant].white ?? logoSources[variant].color;
    return { src: fallback, filter: undefined };
  }

  if (tone === "black" && variant === "mark") {
    return { src: logoSources.mark.color, filter: "grayscale(1) brightness(0.35)" };
  }

  return { src: logoSources[variant].color ?? "", filter: undefined };
};

export const TechServLogo = ({
  variant = "primary",
  tone,
  invert = false,
  width,
  className,
  minWidth,
}: LogoProps) => {
  const requestedTone = tone ?? (invert ? "white" : "color");
  const { src, filter } = resolveTone(variant, requestedTone);
  const resolvedWidth = width ?? defaultWidths[variant];
  const resolvedMinWidth = minWidth ?? minimumWidths[variant];

  return (
    <img
      src={src}
      alt={describeLogo(variant, requestedTone)}
      className={cn("h-auto", className)}
      style={{
        width: resolvedWidth,
        minWidth: resolvedMinWidth,
        filter,
      }}
    />
  );
};

