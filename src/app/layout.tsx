import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { PwaProvider } from "@/components/pwa/pwa-provider";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#064e3b",
};

export const metadata: Metadata = {
  title: "EcoFarm | Connect. Trade. Grow.",
  description:
    "EcoFarm is the high-trust digital platform and marketplace connecting farmers, aquaculture producers, commercial buyers, and service providers across India.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EcoFarm",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    "EcoFarm",
    "Agriculture Marketplace",
    "Aquaculture Network",
    "Farmer Platform",
    "Crop Trading",
    "Fish Farming",
    "Farm Machinery",
  ],
  openGraph: {
    title: "EcoFarm | Connect. Trade. Grow.",
    description:
      "EcoFarm connects farmers, aquaculture producers, commercial buyers, and service providers into an integrated digital operating platform.",
    url: "https://app.ayangiri.com",
    siteName: "EcoFarm",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoFarm | Connect. Trade. Grow.",
    description:
      "High-trust digital platform and marketplace for agriculture and aquaculture.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-surface font-body antialiased">
        <PwaProvider>
          {children}
        </PwaProvider>
      </body>
    </html>
  );
}

