import type { Metadata } from "next";
import "./globals.css";
import "./accessibility-polish.css";

export const metadata: Metadata = {
  title: {
    default: "Work in progress — Vertical Moment",
    template: "%s — Vertical Moment",
  },
  description: "This website is temporarily offline while its content is being reviewed.",
  robots: { index: false, follow: false, nocache: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://verticalmoment.com"),
  openGraph: {
    title: "Work in progress — Vertical Moment",
    description: "This website is temporarily offline while its content is being reviewed.",
    type: "website",
    siteName: "Vertical Moment",
    url: "/",
    images: ["/brand/official-v2/social/forest-og-1200x630.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Work in progress — Vertical Moment",
    description: "This website is temporarily offline while its content is being reviewed.",
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

export default function RootLayout() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <main
          aria-labelledby="maintenance-title"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "clamp(2rem, 6vw, 6rem)",
            background: "#151816",
            color: "#f4f1e9",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "38rem" }}>
            <p
              style={{
                color: "#c4b77c",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Vertical Moment
            </p>
            <h1
              id="maintenance-title"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                lineHeight: 1.05,
                margin: "1rem 0",
              }}
            >
              Work in progress
            </h1>
            <p style={{ fontSize: "1.125rem", lineHeight: 1.7, opacity: 0.82 }}>
              This website is temporarily offline while I review its content. Please check back later.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
