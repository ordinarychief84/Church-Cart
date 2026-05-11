import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "light" | "dark" | "surface";

const VARIANT: Record<Variant, string> = {
  light: "card",
  dark: "card-dark",
  surface: "card-surface",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  interactive?: boolean;
}

export function Card({
  variant = "light",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(VARIANT[variant], interactive && "card-interactive", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
