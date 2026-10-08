import type { Metadata } from "next";
import PlannerFrame from "./PlannerFrame";

export const metadata: Metadata = {
  title: "Climbing Calendar & Outreach",
  description: "Plan climbing events, photography sessions and climber outreach with Vertical Moment. Keep guest notes in this browser or explicitly sync them to your private account.",
  robots: { index: false, follow: false },
};

export default function PlannerPage() {
  return <PlannerFrame />;
}
