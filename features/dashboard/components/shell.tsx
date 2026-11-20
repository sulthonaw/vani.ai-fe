"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarClock, CircleHelp, FastForward, Play } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/libs/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROLE_HOME, formatDay } from "../logic/constants";
import { DemoStoreProvider, useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { NavbarAccountSwitcher, SidebarAccountSwitcher } from "./account-switcher";
import { GlobalSearch } from "./global-search";
import { NAV, matchNav } from "./nav";

function VaniLogo() {
  return (
    <Link href="/" className="flex items-center" aria-label="vani.ai home">
      <Image src="/images/vani-logo.png" alt="vani ai" width={427} height={91} priority className="h-7 w-auto" />
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const account = useActiveAccount();
  const { state } = useDemoStore();
  const current = matchNav(pathname);
  const handedToMe = state.cases.filter(
    (c) => c.status !== "closed" && c.conversation === "handed_over" && (c.coordinatorId === account.id || c.takeoverBy === account.id),
  ).length;
  const urgent = state.cases.filter((c) => c.status !== "closed" && (c.conversation === "urgent" || c.escalated)).length;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-steel-100 bg-white px-3 py-4 md:flex">
      <div className="mb-7 px-2 pt-1">
        <VaniLogo />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {NAV.map((group) => {
          const items = group.items.filter((i) => i.roles.includes(account.role));
          if (!items.length) return null;
          return (
            <div key={group.group}>
              <p className="mb-1.5 px-2 text-[11px] font-medium text-steel-300">{group.group}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = current?.href === item.href;
                  const count = item.badge === "handed" ? handedToMe : item.badge === "urgent" ? urgent : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-steel-500 transition hover:bg-surface hover:text-navy-900",
                          active && "bg-tint text-brand-700 hover:bg-tint hover:text-brand-700",
                        )}
                      >
                        <item.icon className="size-[18px] shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              "min-w-5 rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold text-white",
                              item.badge === "urgent" ? "bg-status-urgent" : "bg-status-handover",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="pt-3">
        <SidebarAccountSwitcher />
      </div>
    </aside>
  );
}

function TopBar() {
  const { state, dispatch } = useDemoStore();
  const account = useActiveAccount();
  const unread = state.cases.filter((c) => c.unread && c.status !== "closed").length;
  const pages = NAV.flatMap((g) => g.items).filter((i) => i.roles.includes(account.role));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-steel-100 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="md:hidden">
        <VaniLogo />
      </div>
      <GlobalSearch pages={pages} />

      <div className="flex items-center gap-1.5 rounded-lg border border-steel-100 bg-surface py-1 pr-1 pl-3">
        <CalendarClock className="size-4 text-steel-500" />
        <span className="text-[13px] font-semibold tabular-nums text-navy-900">
          Day {state.day} <span className="hidden font-medium text-steel-500 lg:inline">· {formatDay(state.day)} · 08:00</span>
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => dispatch({ type: "ADVANCE_DAY", days: 1 })}
                className="ml-1 grid size-7 place-items-center rounded-md bg-brand-500 text-white shadow-sm transition hover:bg-brand-700"
                aria-label="Advance 1 day"
              />
            }
          >
            <Play className="size-3.5 fill-current" />
          </TooltipTrigger>
          <TooltipContent>Advance 1 day (demo clock)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => dispatch({ type: "ADVANCE_DAY", days: 3 })}
                className="grid size-7 place-items-center rounded-md bg-navy-900 text-white transition hover:bg-brand-700"
                aria-label="Advance 3 days"
              />
            }
          >
            <FastForward className="size-3.5 fill-current" />
          </TooltipTrigger>
          <TooltipContent>Advance 3 days</TooltipContent>
        </Tooltip>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger render={<button className="grid size-8 place-items-center rounded-full text-steel-500 hover:bg-surface" aria-label="Help" />}>
            <CircleHelp className="size-[18px]" />
          </TooltipTrigger>
          <TooltipContent className="max-w-60">Use the demo clock to move time forward. Press Ctrl K to search patients and pages.</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<button className="relative grid size-8 place-items-center rounded-full text-steel-500 hover:bg-surface" aria-label="Notifications" />}>
            <Bell className="size-[18px]" />
            {unread > 0 && account.role !== "manager" && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-500 ring-2 ring-white" />}
          </TooltipTrigger>
          <TooltipContent>{account.role === "manager" ? "No notifications" : `${unread} case(s) with unread replies`}</TooltipContent>
        </Tooltip>
        <NavbarAccountSwitcher />
      </div>
    </header>
  );
}

function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const account = useActiveAccount();
  const item = matchNav(pathname);
  const ok = !item || item.roles.includes(account.role);

  React.useEffect(() => {
    if (!ok) router.replace(ROLE_HOME[account.role]);
  }, [ok, account.role, router]);

  if (!ok) return <div className="p-10 text-sm text-steel-500">Switching view…</div>;
  return <>{children}</>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DemoStoreProvider>
      <div lang="en" className="flex min-h-screen w-full bg-surface text-navy-900">
        <React.Suspense fallback={<div className="hidden w-64 shrink-0 border-r border-steel-100 bg-white md:block" />}>
          <Sidebar />
        </React.Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-4 md:p-6">
            <React.Suspense fallback={null}>
              <RoleGuard>{children}</RoleGuard>
            </React.Suspense>
          </main>
        </div>
        <Toaster position="top-center" theme="light" richColors={false} />
      </div>
    </DemoStoreProvider>
  );
}
