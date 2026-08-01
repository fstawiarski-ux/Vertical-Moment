import { getViewer } from "@/lib/identity";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { ContributeWorkspace } from "../components/contribute-workspace";
import { FieldReport } from "../components/field-report";
import { Suspense } from "react";

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
            <ContributeWorkspace />
            <section className="field-report-section">
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
