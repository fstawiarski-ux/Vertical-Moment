import { notFound, redirect } from "next/navigation";
import { isPublicProductionSurface } from "@/src/lib/runtime-surface";

export default async function StartPage() {
  if (await isPublicProductionSurface()) {
    notFound();
  }

  redirect("/explore-app?intro=skip");
}
