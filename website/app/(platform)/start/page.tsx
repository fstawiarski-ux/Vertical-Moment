import { notFound, redirect } from "next/navigation";

export default function StartPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  redirect("/explore-app?intro=skip");
}
