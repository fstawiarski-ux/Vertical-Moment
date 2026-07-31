import { getViewer } from "@/lib/identity";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { ContributeWorkspace } from "../components/contribute-workspace";

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
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
