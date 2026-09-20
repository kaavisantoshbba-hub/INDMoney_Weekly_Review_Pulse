import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-newsreader",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "INDMoney Weekly Review Pulse",
  description:
    "Turn recent public App Store and Google Play reviews of INDMoney into a one-page weekly pulse and a draft email.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${plex.variable} ${newsreader.variable} ${devanagari.variable} antialiased font-sans`}
      >
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
