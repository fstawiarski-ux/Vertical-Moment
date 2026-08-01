import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertical Moment Collective — climbing areas near Vienna",
  description: "Climbing areas near Vienna — browse crags and routes on the map, and contribute field documentation.",
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
