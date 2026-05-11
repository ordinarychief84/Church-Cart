import type { HTMLAttributes, ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "verified" | "kingdom";

const VARIANT: Record<Variant, string> = {
  verified: "badge-verified",
  kingdom: "badge-kingdom",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  withIcon?: boolean;
  children?: ReactNode;
}

/**
 * Two brand-canonical badges:
 *   verified — sand pill on cards, neutral
 *   kingdom  — gold pill, used on "Kingdom Verified" seller marks per doc
 */
export function Badge({
  variant = "verified",
  withIcon = true,
  className,
  children = "Kingdom Verified",
  ...rest
}: BadgeProps) {
  return (
    <span className={cn(VARIANT[variant], className)} {...rest}>
      {withIcon && <ShieldCheck size={10} />}
      {children}
    </span>
  );
}
