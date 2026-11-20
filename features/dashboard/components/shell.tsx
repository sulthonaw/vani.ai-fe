"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronsRight, ChevronRight } from "lucide-react";
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
      <Image src="/images/vani-logo.png" alt="vani ai" width={427} height={91} priority className="h-6 w-auto" />
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
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#E8EBF1] bg-white px-3 py-5 md:flex">
      <div className="mb-8 px-2.5">
        <VaniLogo />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {NAV.map((group) => {
          const items = group.items.filter((i) => i.roles.includes(account.role));
          if (!items.length) return null;
          return (
            <div key={group.group}>
              <p className="mb-1 px-2.5 text-[11px] font-medium text-steel-300">{group.group}</p>
              <ul className="space-y-px">
                {items.map((item) => {
                  const active = current?.href === item.href;
                  const count = item.badge === "handed" ? handedToMe : item.badge === "urgent" ? urgent : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-steel-500 transition-colors hover:bg-[#F4F5F8] hover:text-navy-950",
                          active && "bg-[#F1F3F7] text-navy-950",
                        )}
                      >
                        <item.icon className={cn("size-4 shrink-0", active ? "text-navy-950" : "text-steel-300")} />
                        <span className="flex-1">{item.label}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              "min-w-5 rounded px-1.5 text-center text-[11px] font-medium tabular-nums",
                              item.badge === "urgent" ? "bg-[#FDECEC] text-[#C9373C]" : "bg-[#EEF1F6] text-navy-800",
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

      <div className="border-t border-[#EEF0F4] pt-3">
        <SidebarAccountSwitcher />
      </div>
    </aside>
  );
}

function DemoClock() {
  const { state, dispatch } = useDemoStore();
  const button = "grid size-7 place-items-center text-steel-500 transition hover:bg-[#F1F3F7] hover:text-navy-950";
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-lg border border-[#E8EBF1] bg-white">
      <span className="flex items-center gap-2 px-3 text-xs">
        <span className="size-1.5 rounded-full bg-status-active" />
        <span className="font-semibold tabular-nums text-navy-950">Day {state.day}</span>
        <span className="hidden text-steel-500 lg:inline">{formatDay(state.day)}</span>
      </span>
      <span className="h-full w-px bg-[#E8EBF1]" />
      <Tooltip>
        <TooltipTrigger render={<button onClick={() => dispatch({ type: "ADVANCE_DAY", days: 1 })} className={button} aria-label="Advance 1 day" />}>
          <ChevronRight className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Advance 1 day (demo clock)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<button onClick={() => dispatch({ type: "ADVANCE_DAY", days: 3 })} className={button} aria-label="Advance 3 days" />}>
          <ChevronsRight className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Advance 3 days</TooltipContent>
      </Tooltip>
    </div>
  );
}

function TopBar() {
  const { state } = useDemoStore();
  const account = useActiveAccount();
  const unread = state.cases.filter((c) => c.unread && c.status !== "closed").length;
  const pages = NAV.flatMap((g) => g.items).filter((i) => i.roles.includes(account.role));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#E8EBF1] bg-white/80 px-4 backdrop-blur md:px-8">
      <div className="md:hidden">
        <VaniLogo />
      </div>
      <GlobalSearch pages={pages} />
      <div className="ml-auto flex items-center gap-2">
        <DemoClock />
        <Tooltip>
          <TooltipTrigger
            render={<button className="relative grid size-8 place-items-center rounded-lg text-steel-500 transition hover:bg-[#F1F3F7] hover:text-navy-950" aria-label="Notifications" />}
          >
            <Bell className="size-4" />
            {unread > 0 && account.role !== "manager" && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-500" />}
          </TooltipTrigger>
          <TooltipContent>{account.role === "manager" ? "No notifications" : `${unread} case(s) with unread replies`}</TooltipContent>
        </Tooltip>
        <span className="mx-1 h-5 w-px bg-[#E8EBF1]" />
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

/** Server-rendered placeholder while the demo state is read from the browser. */
function ShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-surface">
      <div className="hidden w-60 shrink-0 border-r border-[#E8EBF1] bg-white px-5 py-5 md:block">
        <div className="h-6 w-24 rounded bg-[#EEF1F6]" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 rounded-md bg-[#F4F5F8]" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="h-14 border-b border-[#E8EBF1] bg-white" />
        <div className="mx-auto max-w-[1400px] space-y-4 p-8">
          <div className="h-7 w-48 rounded bg-[#EEF1F6]" />
          <div className="h-28 rounded-xl bg-white" />
          <div className="h-72 rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
}

function MainViewport({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFlushQueue = pathname === "/dashboard/doctor-queue";
  const isCaseDetail = pathname.startsWith("/dashboard/cases/");

  return (
    <main
      className={cn(
        "flex-1",
        isFlushQueue
          ? "h-[calc(100vh-3.5rem)] overflow-hidden p-0"
          : isCaseDetail
            ? "px-4 py-4 md:px-8 md:py-5"
            : "px-4 py-6 md:px-8 md:py-8",
      )}
    >
      <div className={cn("w-full", isFlushQueue ? "h-full" : "mx-auto max-w-[1400px]")}>
        <RoleGuard>{children}</RoleGuard>
      </div>
    </main>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DemoStoreProvider fallback={<ShellSkeleton />}>
      <div lang="en" className="flex min-h-screen w-full bg-surface text-navy-900 antialiased">
        <React.Suspense fallback={<div className="hidden w-60 shrink-0 border-r border-[#E8EBF1] bg-white md:block" />}>
          <Sidebar />
        </React.Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <React.Suspense fallback={null}>
            <MainViewport>{children}</MainViewport>
          </React.Suspense>
        </div>
        <Toaster position="top-center" theme="light" />
      </div>
    </DemoStoreProvider>
  );
}
