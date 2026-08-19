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
    images: ["/brand/official-v2/social/forest-og-1200x630.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vertical Moment — Climbing Photography",
    description: "Photography from where the movement happens — climbing, portraits and visual technology.",
    images: ["/brand/official-v2/social/forest-og-1200x630.png"],
  },
  icons: {
    icon: "/brand/official-v2/icons/forest-favicon.ico",
    apple: "/brand/official-v2/icons/forest-180.png",
  },
};

// Validates against the only two real states. Older browsers may still have
// a leftover value from the retired five-mode photography switcher (day,
// night, sunny, colorful) cached under this same key — treat anything that
// isn't exactly "light" or "dark" as "light" rather than setting it as-is.
const themeInit = `(function(){try{var t=localStorage.getItem('vm-theme');if(t!=='dark'&&t!=='light'){t='light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
