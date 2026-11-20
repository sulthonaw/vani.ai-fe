import type { Metadata } from "next";
import { TodayView } from "@/features/dashboard";

export default function Page() {
  return <TodayView />;
}

// The dashboard renders on the client (demo state lives in localStorage), so opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: { absolute: "Today · vani.ai demo" } };
