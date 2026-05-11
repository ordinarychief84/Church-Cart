import Link from "next/link";

/**
 * Church Potal logo system — see CHURCH_POTAL_BRAND.md.
 *
 * Approved colours only: Cocoa (#2C1810), White (#FFFFFF), Gold (#DBA44A).
 * Diamond outline + interior church body with golden arch and cross,
 * plus a location pin at the diamond's top to signal "pickup point."
 *
 * Three exported pieces:
 *   <DiamondMark />  — icon-only SVG (40px+ only, never below per brand rules)
 *   <Wordmark />     — CHURCH (display bold) / POTAL (display light gold) stack
 *   <LogoLockup />   — full lockup: mark + wordmark + KINGDOM MARKETPLACE tagline
 *                       wrapped in a Link to "/"
 */

const COCOA = "#2C1810";
const GOLD = "#DBA44A";

export function DiamondMark({
  size = 48,
  className = "",
  variant = "dark",
}: {
  size?: number;
  className?: string;
  variant?: "dark" | "light";
}) {
  // Diamond geometry: centered on a 64×64 viewBox so the mark feels balanced
  // with a generous internal church body. Coordinates picked once and locked.
  const churchFill = variant === "dark" ? "rgba(255,255,255,0.08)" : "#EEE5CC";
  const crossColor = variant === "dark" ? "#FFFFFF" : COCOA;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Church Potal mark"
      className={className}
    >
      {/* Diamond outline */}
      <polygon
        points="32,4 60,32 32,60 4,32"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Church body */}
      <rect x="22" y="30" width="20" height="20" rx="2" fill={churchFill} />

      {/* Golden arch over rect top */}
      <path d="M 22 30 Q 32 18 42 30 L 22 30 Z" fill={GOLD} />

      {/* Cross — vertical + horizontal lines inside the arch */}
      <line
        x1="32"
        y1="22"
        x2="32"
        y2="30"
        stroke={crossColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="28.5"
        y1="26"
        x2="35.5"
        y2="26"
        stroke={crossColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Location pin at the top of the diamond */}
      <circle cx="32" cy="8" r="3.2" fill={GOLD} />
      <circle cx="32" cy="8" r="1.4" fill={COCOA} />
    </svg>
  );
}

export function Wordmark({
  variant = "dark",
  size = "md",
  withTagline = false,
}: {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
}) {
  // "dark" = on a dark background → white CHURCH, gold POTAL
  // "light" = on a light background → cocoa CHURCH, gold POTAL
  const churchClass =
    variant === "dark"
      ? "text-white"
      : "text-[color:var(--cp-cocoa-deep)]";

  const sizes = {
    sm: { church: "text-base", potal: "text-base", tagline: "text-[7px]" },
    md: { church: "text-lg", potal: "text-lg", tagline: "text-[7px]" },
    lg: { church: "text-2xl", potal: "text-2xl", tagline: "text-[8px]" },
  } as const;
  const s = sizes[size];

  const ruleColor = variant === "dark" ? "rgba(219,164,74,0.6)" : "rgba(219,164,74,0.8)";

  return (
    <span className="inline-flex flex-col leading-none">
      <span className={`font-display font-bold tracking-tight ${s.church} ${churchClass}`}>
        CHURCH
      </span>
      <span
        aria-hidden="true"
        className="my-0.5 h-px w-full"
        style={{ background: ruleColor }}
      />
      <span
        className={`font-display font-light tracking-tight ${s.potal} text-[color:var(--cp-gold)]`}
      >
        POTAL
      </span>
      {withTagline && (
        <span
          className={`mt-1 font-ui uppercase ${s.tagline}`}
          style={{
            letterSpacing: "0.25em",
            color: variant === "dark" ? "rgba(255,255,255,0.5)" : "var(--cp-mid)",
          }}
        >
          Kingdom Marketplace
        </span>
      )}
    </span>
  );
}

export function LogoLockup({
  href = "/",
  variant = "dark",
  size = "md",
  withTagline = false,
  className = "",
}: {
  href?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  className?: string;
}) {
  const markSize = size === "lg" ? 56 : size === "sm" ? 36 : 44;
  return (
    <Link href={href} className={`inline-flex items-center gap-3 ${className}`}>
      <DiamondMark size={markSize} variant={variant} />
      <Wordmark variant={variant} size={size} withTagline={withTagline} />
    </Link>
  );
}
