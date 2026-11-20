import type * as React from "react";
import { ChartColumnBig, ClipboardList, LayoutGrid, Settings2, Stethoscope, Waypoints } from "lucide-react";
import type { Role } from "../types";

export type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  badge?: "handed" | "urgent";
};

export const NAV: { group: string; items: NavLink[] }[] = [
  {
    group: "Care",
    items: [
      { href: "/dashboard", label: "Today", icon: LayoutGrid, roles: ["coordinator", "doctor", "manager"] },
      { href: "/dashboard/cases", label: "Cases", icon: ClipboardList, roles: ["coordinator", "doctor"], badge: "handed" },
      { href: "/dashboard/map", label: "Vani Map", icon: Waypoints, roles: ["coordinator", "doctor"] },
    ],
  },
  {
    group: "Clinical",
    items: [{ href: "/dashboard/doctor-queue", label: "Doctor Queue", icon: Stethoscope, roles: ["doctor"], badge: "urgent" }],
  },
  {
    group: "Reports",
    items: [{ href: "/dashboard/insights", label: "Insights", icon: ChartColumnBig, roles: ["coordinator", "doctor", "manager"] }],
  },
  {
    group: "System",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings2, roles: ["doctor"] }],
  },
];

const ALL = NAV.flatMap((g) => g.items);

/** Best matching nav item for a pathname (handles nested routes like /dashboard/cases/c1). */
export function matchNav(pathname: string): NavLink | undefined {
  return ALL.filter((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(`${i.href}/`))).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}
