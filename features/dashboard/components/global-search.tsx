"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FastForward, House, RotateCcw, Search, UserCog, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ACCOUNTS, CONVERSATION_META, STATUS_LABEL } from "../logic/constants";
import { canSeePatients } from "../logic/engine";
import { useActiveAccount, useDemoStore } from "../hooks/use-demo-store";
import type { NavLink } from "./nav";
import { useSwitchAccount } from "./account-switcher";

export function GlobalSearch({ pages }: { pages: NavLink[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { state, dispatch, reset } = useDemoStore();
  const account = useActiveAccount();
  const showPatients = canSeePatients(account.role);
  const switchTo = useSwitchAccount();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-[#E8EBF1] bg-[#F7F8FA] px-3 text-left text-[13px] text-steel-300 transition hover:bg-white"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate">{showPatients ? "Search patients, cases, pages…" : "Search pages…"}</span>
        <kbd className="hidden rounded border border-[#E8EBF1] bg-white px-1.5 font-sans text-[10px] font-medium text-steel-500 sm:block">Ctrl K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search patients, cases and pages" className="top-1/2! -translate-y-1/2! sm:max-w-lg">
        <Command>
        <CommandInput placeholder={showPatients ? "Search patients, pages, accounts or actions…" : "Search pages, accounts or actions…"} />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>No results.</CommandEmpty>

          <CommandGroup heading="Go to">
            {pages.map((p) => (
              <CommandItem key={p.href} value={`go to page ${p.label} ${p.href}`} onSelect={() => go(p.href)}>
                <p.icon className="text-steel-500" />
                {p.label}
                <CommandShortcut>{p.href.replace("/dashboard", "") || "/"}</CommandShortcut>
              </CommandItem>
            ))}
            <CommandItem value="go to landing home page" onSelect={() => go("/")}>
              <House className="text-steel-500" />
              Landing page
              <CommandShortcut>/</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          {showPatients && (
            <CommandGroup heading="Patients & cases">
              {state.cases.map((c) => {
                const p = state.patients.find((x) => x.id === c.patientId)!;
                const conv = CONVERSATION_META[c.conversation];
                return (
                  <CommandItem
                    key={c.id}
                    value={`${p.name} ${STATUS_LABEL[c.status]} ${conv.label} BP ${c.systolic}/${c.diastolic} ${p.area}`}
                    onSelect={() => go(`/dashboard/cases/${c.id}`)}
                  >
                    <UserRound className="text-steel-500" />
                    <span className="flex-1 truncate">
                      <span className="font-medium text-navy-900">{p.name}</span>
                      <span className="text-steel-500">
                        {" "}
                        · BP {c.systolic}/{c.diastolic} · {STATUS_LABEL[c.status]}
                      </span>
                    </span>
                    {c.conversation !== "idle" && (
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: conv.color, background: conv.soft }}>
                        {conv.label}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}


          <CommandSeparator />
          <CommandGroup heading="Switch account">
            {ACCOUNTS.map((a) => (
              <CommandItem
                key={a.id}
                value={`switch account ${a.name} ${a.title}`}
                onSelect={() => {
                  setOpen(false);
                  switchTo(a.id);
                }}
              >
                <UserCog className="text-steel-500" />
                {a.name}
                <CommandShortcut>{a.id === account.id ? "Current" : a.title}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Demo">
            <CommandItem
              value="advance one day demo clock"
              onSelect={() => {
                dispatch({ type: "ADVANCE_DAY", days: 1 });
                setOpen(false);
                toast(`Demo clock advanced to day ${state.day + 1}`);
              }}
            >
              <FastForward className="text-steel-500" />
              Advance demo clock by 1 day
              <CommandShortcut>Day {state.day} → {state.day + 1}</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="reset demo data"
              onSelect={() => {
                reset();
                setOpen(false);
                toast("Demo data reset", { description: "Back to day 17 as Nurse Rina." });
              }}
            >
              <RotateCcw className="text-steel-500" />
              Reset demo data
            </CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
