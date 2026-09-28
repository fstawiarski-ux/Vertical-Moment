import type { Metadata } from "next";
import "./globals.css";
import "./accessibility-polish.css";

export const metadata: Metadata = {
  title: {
    default: "Explore Lab - Climbers Lounge",
    template: "%s - Vertical Moment",
  },
  description: "An offline-capable workspace for climbing regions, crags, routes and spatial studies.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com"),
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
