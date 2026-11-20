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
    <DropdownMenuContent align={align} side={side} sideOffset={6} className="w-60 rounded-xl p-1 shadow-lg border border-steel-100">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-medium tracking-wider text-steel-400 uppercase">
          Switch account (demo)
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={active.id} onValueChange={(v) => switchTo(String(v))}>
          {ACCOUNTS.map((a) => (
            <DropdownMenuRadioItem key={a.id} value={a.id} closeOnClick className="gap-2 rounded-lg px-2 py-1.5 cursor-pointer">
              <Initials
                name={a.name}
                avatarUrl={a.avatar}
                className="size-6 text-[9px]"
                tone={a.id === active.id ? "brand" : "soft"}
              />
              <span className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-navy-900 leading-tight truncate">{a.name}</span>
                <span className="text-[10px] text-steel-500 leading-tight truncate">{a.title}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
      <DropdownMenuSeparator className="my-1" />
      <DropdownMenuItem
        className="gap-2 rounded-lg px-2 py-1.5 text-xs text-steel-500 cursor-pointer"
        onClick={() => {
          reset();
          toast("Demo data reset", { description: "Back to day 17 as Nurse Rina." });
        }}
      >
        <RotateCcw className="size-3.5" /> Reset demo data
      </DropdownMenuItem>
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-steel-400">
        <Info className="size-3" /> All data is synthetic · {FACILITY.short}
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
          "flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-[#F4F5F8]",
          collapsed && "justify-center border-transparent p-1",
        )}
        aria-label="Switch account"
      >
        <Initials name={active.name} avatarUrl={active.avatar} className="size-7 text-[10px]" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-navy-900">{active.name}</span>
              <span className="block truncate text-[10px] text-steel-500">
                {active.title} · {FACILITY.short}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 text-steel-300" />
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
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition hover:bg-surface" aria-label="Switch account">
        <Initials name={active.name} avatarUrl={active.avatar} className="size-7 text-[10px]" />
        <span className="hidden text-left md:block">
          <span className="block text-[11px] font-semibold leading-tight text-navy-900">{active.name}</span>
          <span className="block text-[9.5px] leading-tight text-steel-500">{active.title}</span>
        </span>
        <ChevronsUpDown className="hidden size-3 text-steel-300 md:block" />
      </DropdownMenuTrigger>
      <SwitcherMenu align="end" side="bottom" />
    </DropdownMenu>
  );
}
