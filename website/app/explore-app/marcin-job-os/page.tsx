import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marcin Job OS · private preview | Vertical Moment",
  description: "Private Polish prototype preview for the Marcin Job OS pilot.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default function MarcinJobOsPage() {
  return (
    <main style={{ minHeight: "100dvh", height: "100vh", overflow: "hidden", background: "#050907" }}>
      <iframe
        title="Marcin Job OS private preview"
        src="/private/marcin-job-os.html"
        referrerPolicy="no-referrer"
        style={{ display: "block", width: "100%", height: "100%", border: 0 }}
      />
    </main>
  );
}
