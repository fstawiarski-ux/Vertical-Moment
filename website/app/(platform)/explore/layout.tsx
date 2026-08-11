import type { Metadata } from "next";

// The original Climbers Lounge remains available as a reversible archive,
// but it is intentionally excluded from search while the new workspace is
// developed in private.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ArchivedExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
