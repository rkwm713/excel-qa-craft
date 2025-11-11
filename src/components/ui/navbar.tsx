import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { TechServLogo, type TechServLogoVariant } from "@/components/brand/TechServLogo";

type NavbarProps = {
  className?: string;
  children: ReactNode;
};

export const Navbar = ({ className, children }: NavbarProps) => (
  <header
    className={cn(
      "w-full gradient-blue text-white shadow-brand-lg",
      className,
    )}
  >
    <div className="circuit-pattern mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
      {children}
    </div>
  </header>
);

type NavbarBrandProps = {
  logoVariant?: TechServLogoVariant;
  invertLogo?: boolean;
  width?: number;
  title?: string;
  subtitle?: string;
  className?: string;
};

export const NavbarBrand = ({
  logoVariant = "primary",
  invertLogo = true,
  width = 180,
  title,
  subtitle,
  className,
}: NavbarBrandProps) => (
  <div className={cn("flex items-center gap-5", className)}>
    <TechServLogo variant={logoVariant} invert={invertLogo} width={width} className="shrink-0" />
    {(title || subtitle) && (
      <div className="flex flex-col">
        {title && (
          <span className="font-saira text-lg font-semibold uppercase tracking-[0.05em] text-white">
            {title}
          </span>
        )}
        {subtitle && (
          <span className="font-neuton text-sm text-white/70">
            {subtitle}
          </span>
        )}
      </div>
    )}
  </div>
);

type NavbarNavProps = {
  children: ReactNode;
  className?: string;
};

export const NavbarNav = ({ children, className }: NavbarNavProps) => (
  <nav className={cn("flex items-center gap-2", className)}>{children}</nav>
);

type NavbarLinkProps = {
  to: string;
  children: ReactNode;
  exact?: boolean;
  className?: string;
};

export const NavbarLink = ({ to, exact, className, children }: NavbarLinkProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "rounded-[var(--radius-sm)] px-4 py-2 font-saira text-xs font-semibold uppercase tracking-[0.08em] transition-brand",
        "text-white/80 hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-white focus-visible:outline-[3px] focus-visible:outline-offset-2",
        isActive && "bg-[hsl(var(--primary))] text-primary-foreground shadow-brand-sm",
        className,
      )
    }
    end={exact}
  >
    {children}
  </NavLink>
);

type NavbarActionsProps = {
  children: ReactNode;
  className?: string;
};

export const NavbarActions = ({ children, className }: NavbarActionsProps) => (
  <div className={cn("flex items-center gap-3", className)}>{children}</div>
);

