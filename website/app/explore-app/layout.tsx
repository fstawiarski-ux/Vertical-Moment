import type { Metadata } from "next";
import "./hero-first.css";
import "./phone-tool-ux.css";

export const metadata: Metadata = {
  title: "Climbers Lounge Lab",
  description: "An offline-capable experimental canvas for Vertical Moment climbing photography, panoramas and spatial studies.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Climbers Lounge",
  },
  icons: {
    icon: "/brand/official-v2/icons/forest-192.png",
    apple: "/brand/official-v2/icons/forest-180.png",
  },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#0d1510",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function ExploreAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
