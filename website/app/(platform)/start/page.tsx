import { redirect } from "next/navigation";

// Start's "near you" flow now lives on the home page itself.
export default function StartPage() {
  redirect("/");
}
