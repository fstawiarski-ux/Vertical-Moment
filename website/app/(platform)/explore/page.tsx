import type { Metadata } from "next";
import ExploreAtlasExperience from "./explore-atlas-experience";

export const metadata: Metadata = {
  title: "Climbers Lounge — Vertical Moment",
  description: "An interactive catalog of the canonical Vertical Moment climbing regions, crags and route records.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return <ExploreAtlasExperience />;
}
