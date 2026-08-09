import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vertical Moment — Climbing Photography & Visual Technology",
    template: "%s — Vertical Moment",
  },
  description: "Climbing photography, outdoor visual work and experimental 3D climbing technology from Vertical Moment.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com"),
  openGraph: {
    title: "Vertical Moment — Climbing Photography",
    description: "Photography from where the movement happens — climbing, portraits and visual technology.",
    type: "website",
    siteName: "Vertical Moment",
    url: "/",
    images: ["/photography/banners/og-1200x630-sample.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vertical Moment — Climbing Photography",
    description: "Photography from where the movement happens — climbing, portraits and visual technology.",
    images: ["/photography/banners/og-1200x630-sample.webp"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
