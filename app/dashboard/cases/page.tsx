import type { Metadata } from "next";
import { CasesView } from "@/features/dashboard";

export default function Page() {
  return <CasesView />;
}

// The dashboard renders on the client (demo state lives in localStorage), so opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Cases" };
