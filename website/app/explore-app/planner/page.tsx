import type { Metadata } from "next";
import { ServiceWorkerRegistration } from "@/src/pwa/sw-registration";
import PlannerFrame from "./PlannerFrame";

export const metadata: Metadata = {
  title: "Climbing Calendar & Outreach",
  description: "Plan climbing events, photography sessions and climber outreach with Vertical Moment. Personal notes stay in your browser.",
  robots: { index: false, follow: false },
};

export default function PlannerPage() {
  return <><ServiceWorkerRegistration /><PlannerFrame /></>;
}
