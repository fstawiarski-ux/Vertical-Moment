import type { Metadata } from "next";
import { FieldOpsApp } from "@/src/fieldOps/FieldOpsApp";

export const metadata: Metadata = {
  title: "Field Ops | Vertical Moment",
  description: "Private field acquisition and production relay workspace for Vertical Moment.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default function FieldOpsPage() {
  return <FieldOpsApp />;
}
