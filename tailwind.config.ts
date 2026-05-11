import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Church Potal palette — Deep Cocoa + Harvest Gold on Cream.
        // See CHURCH_POTAL_BRAND.md / design system doc for usage rules.
        cocoa: {
          deep: "#2C1810",
          mid: "#5C3317",
        },
        gold: {
          DEFAULT: "#DBA44A",
          light: "#EFC57A",
          // Multi-shade scale kept for shadow/hover variants used in classes
          // like bg-gold-100 / text-gold-800. Tints stay on-brand.
          50: "#FBF5EC",
          100: "#F5E6C8",
          200: "#EFD8A4",
          300: "#EFC57A",
          400: "#E2B25E",
          500: "#DBA44A",
          600: "#C58F36",
          700: "#A87826",
          800: "#5C3317",
          900: "#3A1F0C",
        },
        cream: "#FBF5EC",
        sand: {
          DEFAULT: "#E8D5B0",
          dark: "#C4A882",
        },
        mid: "#A89070",
        rule: "#E0CEB0",
        success: "#2D7A4F",
        error: "#C0392B",
        // ── Compatibility aliases ──────────────────────────────────────
        // Existing components still reference brand-50..900 from the
        // pre-rebrand era. We remap them onto the Church Potal palette so
        // visuals stay on-brand without a full class sweep. brand-700 is
        // the most-used token (primary buttons + nav) → cocoa-deep.
        brand: {
          50: "#F5E6C8",
          100: "#E8D5B0",
          200: "#C4A882",
          300: "#A89070",
          400: "#DBA44A",
          500: "#C58F36",
          600: "#5C3317",
          700: "#2C1810",
          800: "#1A0E08",
          900: "#0D0704",
        },
      },
      fontFamily: {
        // Default sans (most Tailwind classes resolve here) → DM Sans for UI.
        sans: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Explicit families for typography classes.
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        editorial: ["var(--font-editorial)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        // Body default = editorial (Lora) per the brand doc.
        serif: ["var(--font-editorial)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
