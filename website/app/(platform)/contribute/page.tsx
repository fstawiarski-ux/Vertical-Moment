import { getViewer } from "@/lib/identity";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { ContributeWorkspace } from "../components/contribute-workspace";
import { FieldReport } from "../components/field-report";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contributor Field Beta — Vertical Moment",
  description: "Unlisted local-first field contribution workspace for Vertical Moment.",
  robots: { index: false, follow: false },
};

// Contribution is identity-aware; anonymous still works in the beta.
// Phase 3 requires sign-in here once Auth.js is wired up.
export const dynamic = "force-dynamic";

export default async function ContributePage() {
  await getViewer();
  return (
    <>
      <SiteNav who={null} />
      <main>
        <section className="view">
          <div className="wrap">
            <section className="card" style={{ padding: 18, marginBottom: 20 }} aria-label="Contributor beta status">
              <div className="eyebrow">Unlisted field beta</div>
              <h1 style={{ fontSize: "clamp(24px,4vw,36px)", margin: "6px 0" }}>Test freely. Nothing publishes automatically.</h1>
              <p className="muted" style={{ margin: 0, maxWidth: 760 }}>
                Drafts and original files stay on this device. Export a review package when you want to inspect or move them.
                This URL is unlisted, but it is not an authenticated private area yet.
              </p>
            </section>
            <ContributeWorkspace />
            <section className="field-report-section" id="quick-report">
              <div className="eyebrow">Fast field action</div>
              <h1>Report from the field</h1>
              <p className="muted">GPS, photos, notes or parking details — send whatever you have, no account needed.</p>
              <Suspense fallback={<div className="muted">Loading report form...</div>}>
                <FieldReport />
              </Suspense>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
