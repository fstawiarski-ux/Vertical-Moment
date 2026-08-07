import { redirect } from "next/navigation";

// Explore's search now lives directly on the home page, below the map.
export default function ExplorePage() {
  redirect("/");
}
