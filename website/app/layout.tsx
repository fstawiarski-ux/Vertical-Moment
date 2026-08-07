import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vertical Moment — Climbing Photography & Visual Technology",
    template: "%s — Vertical Moment",
  },
  description: "Climbing photography, outdoor visual work and experimental 3D climbing technology from Vertical Moment.",
  metadataBase: undefined,
  openGraph: {
    title: "Vertical Moment — Climbing Photography",
    description: "Photography from where the movement happens — climbing, portraits and visual technology.",
    type: "website",
  },
};

const themeInit = `(function(){try{var t=localStorage.getItem('vm-theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

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
