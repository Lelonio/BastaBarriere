import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BastaBarriere - Segnalazione Buche e Barriere Architettoniche",
  description: "App per segnalare buche e barriere architettoniche nella città di Civitavecchia. Aiuta a rendere la città più sicura e accessibile per tutti.",
  keywords: ["BastaBarriere", "Civitavecchia", "buche", "barriere architettoniche", "segnalazioni", "sicurezza", "accessibilità"],
  authors: [{ name: "BastaBarriere" }],
  openGraph: {
    title: "BastaBarriere",
    description: "Segnala buche e barriere architettoniche per rendere Civitavecchia più sicura",
    url: "https://basta-barriere.it",
    siteName: "BastaBarriere",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BastaBarriere",
    description: "Segnala buche e barriere architettoniche per rendere Civitavecchia più sicura",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
