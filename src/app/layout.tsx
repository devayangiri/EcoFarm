import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agri-Aqua Network | Connect. Trade. Grow.",
  description:
    "High-trust B2B digital business network and marketplace connecting the Agriculture and Aquaculture ecosystem.",
  keywords: [
    "Agriculture Marketplace",
    "Aquaculture Network",
    "Farmer B2B",
    "Crop Trading",
    "Seafood Trade",
    "Farm Machinery",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-surface font-body antialiased">
        {children}
      </body>
    </html>
  );
}
