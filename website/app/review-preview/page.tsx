import { SiteFooter } from "../components/site-footer";
import { SiteNav } from "../components/site-nav";
import { ReviewPreview } from "../components/review-preview";
import reviewData from "../data/review-routes.json";

export const metadata = {
  title: "Guidebook Reconciliation · Vertical Moment",
  description: "Draft-PR preview of the approved guidebook source reconciliation.",
};

export default function ReviewPreviewPage() {
  return (
    <>
      <SiteNav />
      <main className="review-page"><div className="wrap"><ReviewPreview routes={reviewData.routes} /></div></main>
      <SiteFooter />
    </>
  );
}
