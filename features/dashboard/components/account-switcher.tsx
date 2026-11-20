"use client";

import * as React from "react";
import { ChevronsUpDown, Info, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/libs/utils";
import { ACCOUNTS, FACILITY } from "../logic/constants";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import { Initials } from "./ui-kit";

export function useSwitchAccount() {
  const { dispatch } = useDemoStore();
  return React.useCallback(
    (id: string) => {
      const acc = ACCOUNTS.find((a) => a.id === id);
      if (!acc) return;
      dispatch({ type: "SWITCH_ACCOUNT", id });
      toast(`Now viewing as ${acc.name}`, { description: acc.title });
    },
    [dispatch],
  );
}

function SwitcherMenu({ align, side }: { align: "start" | "end"; side: "top" | "bottom" }) {
  const { reset } = useDemoStore();
  const active = useActiveAccount();
  const switchTo = useSwitchAccount();

  return (
    <DropdownMenuContent align={align} side={side} sideOffset={8} className="w-72 rounded-xl p-1.5">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-wide">Switch account (demo)</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={active.id} onValueChange={(v) => switchTo(String(v))}>
          {ACCOUNTS.map((a) => (
            <DropdownMenuRadioItem key={a.id} value={a.id} closeOnClick className="gap-2.5 rounded-lg px-2 py-2">
              <Initials name={a.name} className="size-7 text-[10px]" tone={a.id === active.id ? "brand" : "soft"} />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-navy-900">{a.name}</span>
                <span className="text-xs text-steel-500">{a.title}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="gap-2 rounded-lg px-2 py-2 text-steel-500"
        onClick={() => {
          reset();
          toast("Demo data reset", { description: "Back to day 17 as Nurse Rina." });
        }}
      >
        <RotateCcw className="size-4" /> Reset demo data
      </DropdownMenuItem>
      <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-steel-300">
        <Info className="size-3.5" /> All data is synthetic · {FACILITY.short}
      </div>
    </DropdownMenuContent>
  );
}

/** Account card at the bottom of the sidebar */
export function SidebarAccountSwitcher({ collapsed }: { collapsed?: boolean }) {
  const active = useActiveAccount();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-[#F4F5F8]",
          collapsed && "justify-center border-transparent p-1",
        )}
        aria-label="Switch account"
      >
        <Initials name={active.name} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-navy-900">{active.name}</span>
              <span className="block truncate text-[11px] text-steel-500">
                {active.title} · {FACILITY.short}
              </span>
            </span>
            <ChevronsUpDown className="size-4 text-steel-300" />
          </>
        )}
      </DropdownMenuTrigger>
      <SwitcherMenu align="start" side="top" />
    </DropdownMenu>
  );
}

/** Avatar in the top navbar */
export function NavbarAccountSwitcher() {
  const active = useActiveAccount();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-surface" aria-label="Switch account">
        <Initials name={active.name} />
        <span className="hidden text-left md:block">
          <span className="block text-xs font-semibold leading-tight text-navy-900">{active.name}</span>
          <span className="block text-[10px] leading-tight text-steel-500">{active.title}</span>
        </span>
        <ChevronsUpDown className="hidden size-3.5 text-steel-300 md:block" />
      </DropdownMenuTrigger>
      <SwitcherMenu align="end" side="bottom" />
    </DropdownMenu>
  );
}
