import type { Metadata } from "next";
import ExploreAtlasExperience from "./explore-atlas-experience";

export const metadata: Metadata = {
  title: "Climbers Lounge — Vertical Moment",
  description: "An interactive field guide to 26 climbing regions, 187 crags and 2,314 routes from the Vertical Moment review atlas.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return <ExploreAtlasExperience />;
}
