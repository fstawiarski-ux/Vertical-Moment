import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Lab",
  description: "An offline-capable experimental canvas for Vertical Moment climbing photography, panoramas and spatial studies.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Explore Lab",
  },
  icons: {
    icon: "/icons/explore-app-192.png",
    apple: "/icons/explore-app-192.png",
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
