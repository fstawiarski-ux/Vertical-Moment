import ExploreApp from "@/src/App";
import type { ExploreContentRegistry } from "@/src/core/types";
import exploreContent from "../../public/explore-content.json";

export default function ExploreAppPage() {
  return <ExploreApp initialRegistry={exploreContent as unknown as ExploreContentRegistry} />;
}
