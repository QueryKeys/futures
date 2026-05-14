import type { Metadata, Viewport } from "next";
import { Heebo, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { he } from "@poly-il/shared";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${he.common.appName} — ${he.common.tagline}`,
  description: he.common.tagline,
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-bg text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
