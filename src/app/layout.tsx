import type { Metadata } from "next";
import { Outfit, Lora, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Church Potal type stack — see brand doc.
//  - Outfit         → display / logo / hero
//  - Lora           → editorial / body / quotes
//  - DM Sans        → UI / labels / buttons / nav
//  - IBM Plex Mono  → codes / IDs
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-ui",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Church Potal — Kingdom Marketplace",
  description:
    "Buy. Sell. Serve. Within the Kingdom. A Christian marketplace for Nigeria with church-pickup logistics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${lora.variable} ${dmSans.variable} ${plexMono.variable}`}
    >
      <body className="font-serif">{children}</body>
    </html>
  );
}
