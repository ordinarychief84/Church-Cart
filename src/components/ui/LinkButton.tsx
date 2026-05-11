import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const SIZE: Record<Size, string> = {
  sm: "cp-btn-sm",
  md: "cp-btn-md",
  lg: "cp-btn-lg",
};

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: Variant;
    size?: Size;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    children?: ReactNode;
    className?: string;
  };

export function LinkButton({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: Props) {
  return (
    <Link className={cn(VARIANT[variant], SIZE[size], className)} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
