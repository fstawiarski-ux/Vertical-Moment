import ExploreApp from "@/src/App";
import type { ExploreContentRegistry } from "@/src/core/types";
import { notFound } from "next/navigation";
import { isPublicProductionSurface } from "@/src/lib/runtime-surface";
import exploreContent from "../../public/explore-content.json";

export default async function ExploreAppPage() {
  if (await isPublicProductionSurface()) {
    notFound();
  }

  return <ExploreApp initialRegistry={exploreContent as unknown as ExploreContentRegistry} />;
}
