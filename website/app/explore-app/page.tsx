import ExploreApp from "@/src/App";
import type { ExploreContentRegistry } from "@/src/core/types";
import { notFound } from "next/navigation";
import exploreContent from "../../public/explore-content.json";

export default function ExploreAppPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ExploreApp initialRegistry={exploreContent as unknown as ExploreContentRegistry} />;
}
