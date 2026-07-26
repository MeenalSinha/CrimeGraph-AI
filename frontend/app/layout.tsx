import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineProvider from "@/components/OfflineProvider";

// Deliberately using system font stacks (defined in globals.css) instead of
// next/font/google: that loader needs network access to fonts.googleapis.com
// at BUILD time, which breaks offline/sandboxed CI and locked-down corporate
// networks. Swap in next/font/google or self-hosted font files if your judging
// environment has open internet access and you want the exact typefaces.

export const metadata: Metadata = {
  title: "CrimeGraph AI",
  description: "Predictive Crime Intelligence and Criminal Network Analytics Platform",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050B18",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <OfflineProvider />
      </body>
    </html>
  );
}
