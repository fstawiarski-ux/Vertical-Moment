import type { Metadata } from "next";
import PlannerFrame from "./PlannerFrame";

export const metadata: Metadata = {
  title: "Mountain Calendar & Outreach",
  description: "Find climbing, hiking, alpine training and mountain events in Austria and nearby countries. Plan photography and organiser outreach with notes and backups saved in this browser.",
  robots: { index: false, follow: false },
};

export default function PlannerPage() {
  return <PlannerFrame />;
}
