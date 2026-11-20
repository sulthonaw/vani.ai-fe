import type { Metadata } from "next";
import { DashboardShell } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "vani.ai — Care Dashboard (demo)",
  description: "Every abnormal screening result has an owner, until it is closed.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
