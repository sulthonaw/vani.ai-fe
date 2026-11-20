import type { Metadata } from "next";
import { DashboardShell } from "@/features/dashboard";

export const metadata: Metadata = {
  title: { default: "Dashboard demo", template: "%s · vani.ai demo" },
  description: "Interactive demo of the vani.ai care dashboard with synthetic data: cases, Vani Map, WhatsApp follow-up, doctor queue and insights.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

// The dashboard renders on the client (demo state lives in localStorage), so opt out of instant-navigation validation.
export const instant = false;
